import prisma from "@/lib/prisma";
import type { OscarsRoundDTO } from "@/lib/shared/types";
import { toMovieWinner } from "./transform";

/**
 * Fetches the most recent still-open round, together with each winner movie's
 * current partial average rating and per-user votes.
 *
 * Intended for the admin oscars preview: a round only becomes `oscarable` once it
 * is closed, so the last open round is selected purely by `closed: false`. The
 * returned ratings represent the live, partial status of voting.
 *
 * @param cineforumId - The cineforum identifier
 * @param userId - The requesting user's id (used to surface their own vote)
 * @returns The open round as an OscarsRoundDTO, or null if none exists
 */
export async function getLastOpenOscarRound(
  cineforumId: string,
  userId: string,
): Promise<OscarsRoundDTO | null> {
  const round = await prisma.round.findFirst({
    where: { cineforumId, closed: false },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      chooser: { select: { id: true, name: true } },
      proposals: {
        where: { winnerId: { not: null } },
        orderBy: { date: "desc" },
        include: {
          winner: {
            select: {
              id: true,
              title: true,
              year: true,
              actors: true,
              image: true,
              imageMedium: true,
              poster: true,
              overview: true,
              imdbRating: true,
              voteAverage: true,
              tomatometer: true,
              metascore: true,
            },
          },
          ownerUser: { select: { name: true } },
          ownerTeam: { select: { name: true } },
        },
      },
    },
  });

  if (!round) return null;

  // Fetch all votes for this round once, then group per movie (avoids N+1).
  const votes = await prisma.movieVote.findMany({
    where: { roundId: round.id },
    select: {
      movieId: true,
      rating: true,
      user: { select: { id: true, name: true } },
    },
  });

  const winners = round.proposals
    .filter((p) => p.winner)
    .map((proposal) => toMovieWinner(proposal, votes, userId));

  return {
    id: round.id,
    name: round.name,
    closed: round.closed,
    date: round.date ? new Date(round.date).toLocaleDateString("it-IT") : null,
    createdAt: new Date(round.createdAt).toLocaleDateString("it-IT"),
    chooser: round.chooser
      ? { id: round.chooser.id, name: round.chooser.name }
      : null,
    winners,
    // Round is still open — no winner has been decided yet.
    bests: [],
  };
}
