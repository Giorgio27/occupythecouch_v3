import prisma from "@/lib/prisma";
import {
  computeWeightedAverages,
  type Totals,
} from "@/lib/server/rankings/weighted-score";

/**
 * Computes each active member's Bayesian-shrunk weighted average rating
 * (see `computeWeightedAverages`) across all of the cineforum's rated
 * proposals — independent of pagination, so the club-wide prior/confidence
 * stay accurate no matter how many rows the caller ends up displaying.
 */
export async function getWeightedAverageRatings(
  cineforumId: string,
): Promise<Map<string, number>> {
  const rows = await prisma.userRankingMovieRoundRanking.findMany({
    where: {
      userRanking: {
        cineforumId,
        user: { memberships: { some: { cineforumId, disabled: false } } },
      },
    },
    select: {
      userRanking: { select: { userId: true } },
      movieRoundRanking: { select: { averageRating: true } },
    },
  });

  const totals = new Map<string, Totals>();
  for (const row of rows) {
    const rating = row.movieRoundRanking.averageRating;
    if (rating == null) continue;
    const userId = row.userRanking.userId;
    const current = totals.get(userId) ?? { sum: 0, n: 0 };
    current.sum += rating;
    current.n += 1;
    totals.set(userId, current);
  }

  return computeWeightedAverages(totals);
}
