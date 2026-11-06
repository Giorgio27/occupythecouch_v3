import { jsonFetch } from "@/lib/client/https";
import type { MovieDetailDTO, MoviesListResponseDTO } from "@/lib/shared/types";

/**
 * Fetches all movies with statistics for a cineforum.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @returns Promise resolving to the movies list with stats
 */
export async function fetchMoviesList(
  cineforumId: string,
): Promise<MoviesListResponseDTO> {
  return jsonFetch<MoviesListResponseDTO>(
    `/api/cineforum/${cineforumId}/movies`,
  );
}

/**
 * Fetches the detail of one movie as seen by a cineforum.
 * Rejects with a "status 404" error when the club never proposed the movie.
 *
 * @param cineforumId - The cineforum the page is scoped to
 * @param movieId - The `Movie.id`
 */
export async function fetchMovieDetail(
  cineforumId: string,
  movieId: string,
): Promise<MovieDetailDTO> {
  return jsonFetch<MovieDetailDTO>(
    `/api/cineforum/${cineforumId}/movies/${encodeURIComponent(movieId)}`,
  );
}
