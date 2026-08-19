import prisma from "@/lib/prisma";
import type { UserRankedMovieDTO } from "@/lib/shared/types";

/** Normalizes a /10 supplier score to the club's /5 rating scale. */
function toClubScale(value: number | null | undefined): number | null {
  if (value == null) return null;
  return parseFloat((value / 2.0).toFixed(2));
}

/**
 * Fetches every movie a user has voted on in a cineforum, sorted by that
 * user's own rating (highest first), with round, proposer and platform
 * vote details for each movie.
 *
 * @param cineforumId - The cineforum to scope votes to
 * @param userId - The user whose ranking to build
 * @returns The user's voted movies, sorted by their rating descending
 */
export async function getUserRankedMovies(
  cineforumId: string,
  userId: string,
): Promise<UserRankedMovieDTO[]> {
  const votes = await prisma.movieVote.findMany({
    where: { userId, round: { cineforumId, closed: true } },
    include: {
      movie: {
        select: {
          title: true,
          voteAverage: true,
          imdbRating: true,
          tomatometer: true,
          metascore: true,
        },
      },
      round: { select: { name: true, date: true } },
      movieRoundRanking: {
        select: {
          averageRating: true,
          roundWinner: true,
          user: { select: { name: true } },
          team: { select: { name: true } },
        },
      },
    },
    orderBy: { rating: "desc" },
  });

  if (votes.length === 0) return [];

  const roundIds = Array.from(new Set(votes.map((v) => v.roundId)));
  const movieIds = Array.from(new Set(votes.map((v) => v.movieId)));

  // Resolve "proposed on" dates via the winning proposal for each (round, movie) pair.
  const proposals = await prisma.proposal.findMany({
    where: { roundId: { in: roundIds }, winnerId: { in: movieIds } },
    select: { roundId: true, winnerId: true, date: true },
  });
  const proposalDateByKey = new Map(
    proposals.map((p) => [`${p.roundId}:${p.winnerId}`, p.date]),
  );

  return votes.map((v) => {
    const owner = v.movieRoundRanking?.user ?? v.movieRoundRanking?.team ?? null;
    const proposalDate = proposalDateByKey.get(`${v.roundId}:${v.movieId}`) ?? null;

    return {
      movieId: v.movieId,
      roundId: v.roundId,
      movie: v.movie.title,
      round: v.round.name,
      roundDate: v.round.date ? v.round.date.toISOString() : null,
      userRating: v.rating,
      movieAverage: v.movieRoundRanking?.averageRating ?? null,
      roundWinner: v.movieRoundRanking?.roundWinner ?? false,
      owner: owner?.name ?? "Unknown",
      proposalDate: proposalDate ? proposalDate.toISOString() : null,
      tmdbVote: toClubScale(v.movie.voteAverage),
      imdbRating: toClubScale(v.movie.imdbRating),
      tomatometer: toClubScale(v.movie.tomatometer),
      metascore: toClubScale(v.movie.metascore),
    };
  });
}
