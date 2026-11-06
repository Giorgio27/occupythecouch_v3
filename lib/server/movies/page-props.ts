import prisma from "@/lib/prisma";

/**
 * Title of a movie the cineforum has proposed at least once, for the movie
 * page's first render. Null when the movie does not exist or belongs only to
 * other clubs, so the page can answer 404 without leaking anything.
 *
 * @param cineforumId - The cineforum the page is scoped to
 * @param movieId - The `Movie.id`
 */
export async function getMovieTitleInCineforum(
  cineforumId: string,
  movieId: string,
): Promise<string | null> {
  const movie = await prisma.movie.findFirst({
    where: {
      id: movieId,
      proposalMovies: { some: { proposal: { cineforumId } } },
    },
    select: { title: true },
  });
  return movie?.title ?? null;
}
