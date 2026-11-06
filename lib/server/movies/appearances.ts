import prisma from "@/lib/prisma";
import { schulzeRankOf, toMovieBallots } from "@/lib/server/movies/ballots";
import type {
  MovieAppearanceDTO,
  MovieAppearanceStatus,
} from "@/lib/shared/types";

function appearanceStatus(
  closed: boolean,
  winnerId: string | null,
  movieId: string,
): MovieAppearanceStatus {
  if (!closed) return "open";
  return winnerId === movieId ? "won" : "lost";
}

/**
 * Lists every proposal of the cineforum that included the movie, newest first,
 * with its outcome and Schulze rank. Ballots are exposed only for closed
 * proposals that show results, and the rank only once the proposal is closed,
 * so the page never reveals a vote still in progress.
 *
 * @param cineforumId - The cineforum the proposals belong to
 * @param movieId - The `Movie.id`
 */
export async function getMovieAppearances(
  cineforumId: string,
  movieId: string,
): Promise<MovieAppearanceDTO[]> {
  const proposals = await prisma.proposal.findMany({
    where: { cineforumId, movies: { some: { movieId } } },
    select: {
      id: true,
      title: true,
      date: true,
      createdAt: true,
      closed: true,
      showResults: true,
      winnerId: true,
      winner: { select: { title: true } },
      round: { select: { name: true } },
      ownerUser: { select: { name: true } },
      ownerTeam: { select: { name: true } },
      movies: { select: { movieId: true } },
      votes: {
        select: { movieSelection: true, user: { select: { name: true } } },
      },
    },
  });

  // Newest first by the date shown on the card: an undated proposal falls back
  // to createdAt instead of jumping to the top (Postgres sorts NULL first in DESC).
  const shownTime = (p: { date: Date | null; createdAt: Date }): number =>
    (p.date ?? p.createdAt).getTime();
  const newestFirst = [...proposals].sort(
    (a, b) => shownTime(b) - shownTime(a),
  );

  return newestFirst.map((p) => {
    const status = appearanceStatus(p.closed, p.winnerId, movieId);
    const candidateIds = p.movies.map((m) => m.movieId);
    const showBallots = p.closed && p.showResults;

    return {
      proposalId: p.id,
      proposalTitle: p.title,
      date: (p.date ?? p.createdAt).toISOString(),
      roundName: p.round.name,
      owner: p.ownerTeam?.name ?? p.ownerUser?.name ?? "Unknown",
      status,
      winnerTitle: status === "lost" ? (p.winner?.title ?? null) : null,
      candidateCount: candidateIds.length,
      voterCount: p.votes.length,
      schulzeRank: p.closed
        ? schulzeRankOf(movieId, candidateIds, p.votes)
        : null,
      ballots: showBallots ? toMovieBallots(movieId, p.votes) : null,
    };
  });
}
