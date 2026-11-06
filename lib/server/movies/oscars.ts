import prisma from "@/lib/prisma";
import { competitionRanks } from "@/lib/shared/ranking/competition";
import {
  CONSENSUS_MIN_VOTES,
  populationStdDev,
} from "@/lib/shared/ranking/consensus";
import type { MovieOscarsDTO } from "@/lib/shared/types";

/** The consensus ranking's spread measure; null below its vote minimum. */
function consensusStdDev(ratings: number[]): number | null {
  if (ratings.length < CONSENSUS_MIN_VOTES) return null;
  return parseFloat(populationStdDev(ratings).toFixed(2));
}

/**
 * The Oscars outcome of the movie in each closed round of the cineforum: every
 * member's rating, the consensus spread, its F1-style position inside the
 * round and its rank among every movie the club has watched. Closed rounds
 * only, like every other ranking.
 *
 * @param cineforumId - The cineforum identifier
 * @param movieId - The `Movie.id`
 */
export async function getMovieOscars(
  cineforumId: string,
  movieId: string,
): Promise<MovieOscarsDTO[]> {
  const closedRound = { cineforumId, closed: true };
  const [allRankings, movieRankings] = await Promise.all([
    prisma.movieRoundRanking.findMany({
      where: { round: closedRound },
      select: { id: true, roundId: true, averageRating: true },
    }),
    prisma.movieRoundRanking.findMany({
      where: { movieId, round: closedRound },
      select: {
        id: true,
        roundId: true,
        averageRating: true,
        roundWinner: true,
        round: { select: { name: true, date: true, createdAt: true } },
        user: { select: { name: true } },
        team: { select: { name: true } },
        movieVotes: {
          orderBy: { rating: "desc" },
          select: { rating: true, user: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  const toScored = (r: { id: string; averageRating: number | null }) => ({
    id: r.id,
    score: r.averageRating,
  });
  const overallRanks = competitionRanks(allRankings.map(toScored));

  // Newest round first; a round without a date falls back to when it was created.
  const roundTime = (r: { date: Date | null; createdAt: Date }): number =>
    (r.date ?? r.createdAt).getTime();
  const newestFirst = [...movieRankings].sort(
    (a, b) => roundTime(b.round) - roundTime(a.round),
  );

  return newestFirst.map((mrr) => {
    const roundRows = allRankings.filter((r) => r.roundId === mrr.roundId);
    const roundRanks = competitionRanks(roundRows.map(toScored));

    return {
      roundId: mrr.roundId,
      roundName: mrr.round.name,
      owner: mrr.team?.name ?? mrr.user?.name ?? "Unknown",
      averageRating: mrr.averageRating,
      roundWinner: mrr.roundWinner,
      roundPosition: roundRanks.get(mrr.id) ?? null,
      roundSize: roundRanks.size,
      overallRank: overallRanks.get(mrr.id) ?? null,
      overallTotal: overallRanks.size,
      stdDev: consensusStdDev(mrr.movieVotes.map((v) => v.rating)),
      votes: mrr.movieVotes.map((v) => ({
        userId: v.user.id,
        userName: v.user.name ?? "Unknown",
        rating: v.rating,
      })),
    };
  });
}
