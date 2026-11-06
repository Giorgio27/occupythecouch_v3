import prisma from "@/lib/prisma";
import {
  CONSENSUS_MIN_VOTES,
  populationStdDev,
} from "@/lib/shared/ranking/consensus";
import type { ConsensusMovieDTO } from "@/lib/shared/types";

/**
 * Minimum number of member votes required for a movie to appear in the
 * consensus rankings. Shared with the client, which explains the threshold.
 */
export const MIN_VOTES = CONSENSUS_MIN_VOTES;

/**
 * Computes, per movie watched in a closed round of the cineforum, how much the
 * members agreed on it — measured as the population standard deviation of the
 * member ratings (the "consensus axis").
 *
 * High std_dev → divisive (half loved it, half hated it).
 * Low std_dev  → unanimous (everyone landed on roughly the same score).
 *
 * One entry per MovieRoundRanking, mirroring {@link getMovieRankings} so a movie
 * watched in two rounds yields two entries. The returned list is sorted by
 * divergence (highest first); the page slices the two ends.
 *
 * @param cineforumId - The cineforum identifier
 * @returns Consensus rows and the applied MIN_VOTES threshold
 */
export async function getConsensusRankings(
  cineforumId: string,
): Promise<{ body: ConsensusMovieDTO[]; minVotes: number }> {
  const rankings = await prisma.movieRoundRanking.findMany({
    where: { round: { cineforumId, closed: true } },
    select: {
      id: true,
      movieId: true,
      movie: { select: { title: true } },
      round: { select: { name: true } },
      user: { select: { name: true } },
      team: { select: { name: true } },
      movieVotes: {
        select: { id: true, rating: true, user: { select: { name: true } } },
        orderBy: { rating: "desc" },
      },
    },
  });

  const body: ConsensusMovieDTO[] = [];

  for (const r of rankings) {
    const ratings = r.movieVotes.map((v) => v.rating);
    const n = ratings.length;
    if (n < MIN_VOTES) continue;

    const mean = ratings.reduce((s, x) => s + x, 0) / n;
    const stdDev = populationStdDev(ratings);
    const owner = r.user ?? r.team;

    body.push({
      id: r.id,
      movie: r.movie.title,
      movie_id: r.movieId,
      round: r.round.name,
      owner: owner?.name ?? "Unknown",
      average_rating: parseFloat(mean.toFixed(2)),
      std_dev: parseFloat(stdDev.toFixed(2)),
      min_rating: Math.min(...ratings),
      max_rating: Math.max(...ratings),
      vote_count: n,
      movie_votes: r.movieVotes.map((v) => ({
        id: v.id,
        rating: v.rating,
        user: v.user.name ?? "Unknown",
      })),
    });
  }

  // Most divisive first; break ties by the raw spread (max − min).
  body.sort(
    (a, b) =>
      b.std_dev - a.std_dev ||
      b.max_rating - b.min_rating - (a.max_rating - a.min_rating),
  );

  return { body, minVotes: MIN_VOTES };
}
