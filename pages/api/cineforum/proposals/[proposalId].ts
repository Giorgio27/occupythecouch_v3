import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const proposalId = req.query.proposalId as string;
  const p = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      winner: true,
      round: true,
      movies: { include: { movie: true } },
      votes: { include: { user: { select: { id: true, name: true } } } },
      cineforum: { select: { id: true } },
    },
  });
  if (!p) return res.status(404).json({ error: "Not found" });

  const membersCount = await prisma.membership.count({
    where: { cineforumId: p.cineforumId },
  });
  const votersCount = p.votes.length;
  const noVotesLeft = votersCount >= membersCount;

  const body = {
    id: p.id,
    date: p.date ? new Date(p.date).toLocaleDateString("it-IT") : null,
    owner: p.ownerUserId
      ? { id: p.ownerUserId, type: "User" }
      : p.ownerTeamId
      ? { id: p.ownerTeamId, type: "Team" }
      : null,
    movies: p.movies.map((pm) => pm.movie),
    winner: p.winner,
    closed: p.closed,
    votes: p.votes.map((v) => ({
      id: v.id,
      user: { id: v.userId, name: v.user?.name ?? "" },
      movie_selection: v.movieSelection as Record<string, string[]>,
    })),
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
