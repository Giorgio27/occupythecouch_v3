import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { telegramNotify } from "@/lib/server/external";
import { buildVoteNotificationText } from "@/lib/server/proposals/vote-notification";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const { proposalId, lists } = req.body || {};
  const userId = session.user.id;
  if (!proposalId || !lists || !userId)
    return res.status(400).json({ error: "Missing fields" });

  // Fetch proposal with all data needed for the notification in one query.
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: {
      closed: true,
      cineforumId: true,
      movies: { select: { movie: { select: { id: true, title: true } } } },
      votes: { select: { userId: true, movieSelection: true } },
      cineforum: {
        select: {
          telegramBotToken: true,
          telegramChatId: true,
          locale: true,
          memberships: {
            where: { disabled: false },
            select: { userId: true, user: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!proposal) return res.status(404).json({ error: "Proposal not found" });
  if (proposal.closed)
    return res.status(400).json({ error: "Proposal is closed" });

  const movieSelection: Record<string, string[]> = {};
  for (const k of Object.keys(lists)) {
    movieSelection[k] = (lists[k] || []) as string[];
  }

  const alreadyVoted = proposal.votes.some((v) => v.userId === userId);

  const upsertedVote = await prisma.proposalVote.upsert({
    where: { proposalId_userId: { proposalId, userId } },
    create: { proposalId, userId, movieSelection },
    update: { movieSelection },
  });

  type VoteEntry = {
    userId: string;
    movieSelection: Record<string, string[]> | null;
  };
  // Build the updated votes list (replace the voter's old entry with the new one).
  const updatedVotes: VoteEntry[] = [
    ...proposal.votes
      .filter((v) => v.userId !== userId)
      .map((v) => ({
        userId: v.userId,
        movieSelection: (v.movieSelection ?? null) as Record<
          string,
          string[]
        > | null,
      })),
    {
      userId,
      movieSelection: upsertedVote.movieSelection as Record<
        string,
        string[]
      > | null,
    },
  ];

  // Determine which active members have not yet voted.
  const votedUserIds = new Set(updatedVotes.map((v) => v.userId));
  const missingUserNames = (proposal.cineforum?.memberships ?? [])
    .filter((m) => !votedUserIds.has(m.userId))
    .map((m) => m.user.name ?? m.userId);

  const voterName =
    session.user.name ??
    proposal.cineforum?.memberships.find((m) => m.userId === userId)?.user
      .name ??
    userId;

  const movies = proposal.movies.map((pm) => pm.movie);

  const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "";
  const proposalUrl = `${NEXTAUTH_URL}/cineforum/${proposal.cineforumId}/proposal`;

  // Fire-and-forget: never let a Telegram error fail the vote response.
  buildAndSendNotification({
    voterName,
    alreadyVoted,
    missingUserNames,
    movies,
    votes: updatedVotes,
    token: proposal.cineforum?.telegramBotToken ?? null,
    chatId: proposal.cineforum?.telegramChatId ?? null,
    locale: proposal.cineforum?.locale ?? "it",
    proposalUrl,
  }).catch(() => {});

  return res.status(201).json({ ok: true });
}

async function buildAndSendNotification(params: {
  voterName: string;
  alreadyVoted: boolean;
  missingUserNames: string[];
  movies: { id: string; title: string }[];
  votes: { userId: string; movieSelection: Record<string, string[]> | null }[];
  token: string | null;
  chatId: string | null;
  locale: string;
  proposalUrl: string;
}): Promise<void> {
  const text = buildVoteNotificationText({
    voterName: params.voterName,
    alreadyVoted: params.alreadyVoted,
    missingUserNames: params.missingUserNames,
    movies: params.movies,
    votes: params.votes.map((v) => ({ movieSelection: v.movieSelection })),
    locale: params.locale,
    proposalUrl: params.proposalUrl,
  });
  await telegramNotify(text, params.token, params.chatId);
}
