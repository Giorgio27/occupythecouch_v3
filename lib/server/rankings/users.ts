import prisma from "@/lib/prisma";
import { toMovieRoundRankingDTO } from "@/lib/server/rankings/movie-round-ranking-dto";
import { getWeightedAverageRatings } from "@/lib/server/rankings/user-rating-weights";
import type { UserRankingDTO } from "@/lib/shared/types";

const activeMemberFilter = (cineforumId: string) => ({
  cineforumId,
  user: { memberships: { some: { cineforumId, disabled: false } } },
});

/**
 * Fetches paginated user rankings for a cineforum (active members only,
 * ordered by average rating) plus the count of distinct movies watched.
 * Each row's `average_rating` comes with a `weighted_average_rating`: the
 * same value, shrunk toward the club-wide average by number of rated
 * proposals (see `getWeightedAverageRatings`) — so a single great pick
 * can't automatically outrank a longer, consistently strong track record.
 */
export async function getUserRankings(
  cineforumId: string,
  offset: number,
  limit: number,
): Promise<{ body: UserRankingDTO[]; total: number; totalMoviesVoted: number }> {
  const [watchedMovies, totalCount, weightedRatings, rankings] =
    await Promise.all([
      prisma.proposal.findMany({
        where: { cineforumId, winnerId: { not: null }, round: { closed: true } },
        select: { winnerId: true },
        distinct: ["winnerId"],
      }),
      prisma.userRanking.count({ where: activeMemberFilter(cineforumId) }),
      getWeightedAverageRatings(cineforumId),
      prisma.userRanking.findMany({
        where: activeMemberFilter(cineforumId),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              memberships: {
                where: { cineforumId },
                select: { createdAt: true },
                take: 1,
              },
            },
          },
          movieRoundRankings: {
            include: {
              movieRoundRanking: { include: { movie: true, round: true } },
            },
          },
        },
        orderBy: [{ averageRating: "desc" }, { id: "asc" }],
        skip: offset,
        take: limit,
      }),
    ]);

  const body: UserRankingDTO[] = rankings.map((ranking) => {
    const weighted = weightedRatings.get(ranking.user.id);

    return {
      id: ranking.id,
      average_rating: ranking.averageRating,
      imdb_rating: ranking.averageImdbRating,
      tmdb_vote: ranking.averageTmdbRating,
      tomatometer: ranking.averageRotoRating,
      metascore: ranking.averageMetaRating,
      movie_round_rankings: ranking.movieRoundRankings.map(
        toMovieRoundRankingDTO,
      ),
      user: ranking.user.name,
      user_id: ranking.user.id,
      joined_at:
        ranking.user.memberships[0]?.createdAt.toISOString() ??
        new Date(0).toISOString(),
      weighted_average_rating:
        weighted !== undefined ? Math.round(weighted * 100) / 100 : null,
    };
  });

  return { body, total: totalCount, totalMoviesVoted: watchedMovies.length };
}
