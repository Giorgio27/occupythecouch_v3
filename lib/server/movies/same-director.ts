import prisma from "@/lib/prisma";
import type { MovieRelatedDTO } from "@/lib/shared/types";

/** Enough to suggest a filmography without turning the page into a list. */
const MAX_RELATED = 12;

/**
 * Other movies by the same director that were proposed in the cineforum,
 * with the club's average rating when one was watched in a closed round.
 * Best rated first, then unwatched ones by year.
 *
 * @param cineforumId - The cineforum identifier
 * @param movieId - The movie to exclude
 * @param director - The director to match exactly; null yields no results
 */
export async function getSameDirectorMovies(
  cineforumId: string,
  movieId: string,
  director: string | null,
): Promise<MovieRelatedDTO[]> {
  if (!director) return [];

  // No `take` here: the cap applies after sorting, so the best-rated ones are kept.
  // A director's movies in one club are a handful, so loading them all is cheap.
  const movies = await prisma.movie.findMany({
    where: {
      director,
      id: { not: movieId },
      proposalMovies: { some: { proposal: { cineforumId } } },
    },
    select: {
      id: true,
      title: true,
      year: true,
      movieRoundRankings: {
        where: { round: { cineforumId, closed: true } },
        select: { averageRating: true },
      },
    },
  });

  return movies
    .map((m) => {
      const ratings = m.movieRoundRankings
        .map((r) => r.averageRating)
        .filter((r): r is number => r !== null);
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((s, r) => s + r, 0) / ratings.length
          : null;
      return { id: m.id, title: m.title, year: m.year, averageRating };
    })
    .sort(
      (a, b) =>
        (b.averageRating ?? -1) - (a.averageRating ?? -1) ||
        (b.year ?? 0) - (a.year ?? 0),
    )
    .slice(0, MAX_RELATED);
}
