import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const proposalId = req.query.proposalId as string;
  const session = await getServerSession(req, res, authOptions);
  const currentUserId = session?.user?.id;

  const p = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      winner: true,
      round: true,
      movies: { include: { movie: true } },
      votes: { include: { user: { select: { id: true, name: true } } } },
      cineforum: { select: { id: true } },
      ownerUser: { select: { id: true, name: true } },
      ownerTeam: { select: { id: true, name: true } },
    },
  });
  if (!p) return res.status(404).json({ error: "Not found" });

  const membersCount = await prisma.membership.count({
    where: { cineforumId: p.cineforumId },
  });
  const votersCount = p.votes.length;
  const noVotesLeft = votersCount >= membersCount;

  // Find current user's vote if authenticated
  const myVote = currentUserId
    ? p.votes.find((v) => v.userId === currentUserId)
    : null;

  const body = {
    id: p.id,
    date: p.date ? new Date(p.date).toLocaleDateString("it-IT") : null,
    owner: p.ownerUserId
      ? { id: p.ownerUserId, type: "User", name: p.ownerUser?.name ?? null }
      : p.ownerTeamId
        ? { id: p.ownerTeamId, type: "Team", name: p.ownerTeam?.name ?? null }
        : null,
    movies: p.movies.map((pm) => pm.movie),
    winner: p.winner,
    closed: p.closed,
    votes: p.votes.map((v) => ({
      id: v.id,
      user: { id: v.userId, name: v.user?.name ?? "" },
      movie_selection: v.movieSelection as Record<string, string[]>,
    })),
    my_vote: myVote
      ? {
          id: myVote.id,
          movie_selection: myVote.movieSelection as Record<string, string[]>,
        }
      : null,
    created_at: p.createdAt.toLocaleDateString("it-IT"),
    description: p.description?.replace(/\n/g, "<br>") ?? null,
    title: p.title,
    round: p.round?.name ?? null,
    missing_users: [], // optional to compute later
    no_votes_left: noVotesLeft,
    show_results: p.showResults,
  };

  return res.status(200).json(body);
}
