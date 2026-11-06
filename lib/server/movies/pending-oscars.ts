import prisma from "@/lib/prisma";
import type { MoviePendingOscarsDTO } from "@/lib/shared/types";

/**
 * Oscars votes still running on the movie: one entry per open round in which
 * it won a proposal, even before anyone voted. Only the vote count and the
 * viewer's own rating are returned; other members' ratings stay hidden until
 * the round closes.
 *
 * @param cineforumId - The cineforum identifier
 * @param movieId - The `Movie.id`
 * @param userId - The viewer, whose own rating is surfaced
 */
export async function getMoviePendingOscars(
  cineforumId: string,
  movieId: string,
  userId: string,
): Promise<MoviePendingOscarsDTO[]> {
  const proposals = await prisma.proposal.findMany({
    where: {
      cineforumId,
      closed: true,
      winnerId: movieId,
      round: { closed: false },
    },
    select: {
      round: {
        select: {
          id: true,
          name: true,
          votes: { where: { movieId }, select: { userId: true, rating: true } },
        },
      },
    },
  });

  const byRound = new Map<string, MoviePendingOscarsDTO>();
  for (const { round } of proposals) {
    byRound.set(round.id, {
      roundId: round.id,
      roundName: round.name,
      voteCount: round.votes.length,
      myRating: round.votes.find((v) => v.userId === userId)?.rating ?? null,
    });
  }
  return Array.from(byRound.values());
}
