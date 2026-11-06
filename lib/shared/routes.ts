/**
 * Path of a movie's detail page inside a cineforum.
 *
 * @param cineforumId - The cineforum the page is scoped to
 * @param movieId - The `Movie.id` (cuid), not the IMDb id
 */
export function movieDetailPath(cineforumId: string, movieId: string): string {
  return `/cineforum/${cineforumId}/movies/${movieId}`;
}
