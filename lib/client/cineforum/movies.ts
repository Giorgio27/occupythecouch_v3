import { jsonFetch } from "@/lib/client/https";
import type { MoviesListResponseDTO } from "@/lib/shared/types";

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
