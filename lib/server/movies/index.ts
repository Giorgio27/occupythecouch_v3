import { getMovieAppearances } from "@/lib/server/movies/appearances";
import { getMovieInfo } from "@/lib/server/movies/movie-info";
import { getMovieOscars } from "@/lib/server/movies/oscars";
import { getMoviePendingOscars } from "@/lib/server/movies/pending-oscars";
import { getSameDirectorMovies } from "@/lib/server/movies/same-director";
import type { MovieDetailDTO } from "@/lib/shared/types";

/** Thrown when the movie does not exist or was never proposed in the cineforum. */
export const MOVIE_NOT_FOUND = "MOVIE_NOT_FOUND";

function movieNotFound(): Error & { code: string } {
  const error = new Error("Movie not found in this cineforum") as Error & {
    code: string;
  };
  error.code = MOVIE_NOT_FOUND;
  return error;
}

/**
 * Everything a cineforum knows about one movie: metadata, every proposal it
 * appeared in, its Oscars results in closed rounds, any Oscars vote still
 * running, and other club movies by the same director.
 *
 * Movies are global, so a movie the cineforum never proposed is treated as
 * missing: nothing about other clubs is exposed.
 *
 * @param cineforumId - The cineforum the page is scoped to
 * @param movieId - The `Movie.id`
 * @param userId - The viewer, for their own pending Oscars rating
 * @throws Error with code `MOVIE_NOT_FOUND`
 */
export async function getMovieDetail(
  cineforumId: string,
  movieId: string,
  userId: string,
): Promise<MovieDetailDTO> {
  const [movie, appearances, oscars, pendingOscars] = await Promise.all([
    getMovieInfo(movieId),
    getMovieAppearances(cineforumId, movieId),
    getMovieOscars(cineforumId, movieId),
    getMoviePendingOscars(cineforumId, movieId, userId),
  ]);
  if (!movie || appearances.length === 0) throw movieNotFound();

  const sameDirector = await getSameDirectorMovies(
    cineforumId,
    movieId,
    movie.director,
  );

  return { movie, appearances, oscars, pendingOscars, sameDirector };
}
