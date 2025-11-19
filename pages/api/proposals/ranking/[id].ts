import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { buildBallotsFromMovieSelection, schulze } from "@/lib/ranking";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      movies: { include: { movie: true } },
      votes: true,
    },
  });
  if (!proposal) return res.status(404).json({ error: "Not found" });

  const candidates = proposal.movies.map((pm) => pm.movieId);
  const ballots = buildBallotsFromMovieSelection(
    proposal.votes.map((v) => ({
      movieSelection: (v.movieSelection as any) ?? {},
    })),
    candidates
  );
  const result = schulze(candidates, ballots);

  const sorted_movies = proposal.movies
    .map((pm) => {
      const m = pm.movie;
      return {
        ...m,
        proposal_rank: result.ranking[m.id] ?? null,
      };
    })
    .sort((a, b) => {
      // higher rank first (rank=1 best), so sort ascending by rank
      if (a.proposal_rank == null) return 1;
      if (b.proposal_rank == null) return -1;
      return a.proposal_rank - b.proposal_rank;
    });

  const votes = proposal.votes.map((v) => ({
    id: v.id,
    user: { id: v.userId }, // enrich with name on consumer if needed
    movie_selection: v.movieSelection as Record<string, string[]>,
  }));

  return res.status(200).json({ votes, sorted_movies });
}
