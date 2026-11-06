import prisma from "@/lib/prisma";
import type { MovieInfoDTO } from "@/lib/shared/types";

/**
 * Normalizes a TMDB JSONB list stored either as `string[]` or as objects
 * (`{ name }` for genres, `{ iso_3166_1, name }` for countries) into names.
 */
function jsonNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: unknown): string => {
      if (typeof item === "string") return item;
      if (typeof item !== "object" || item === null) return "";
      const { name, iso_3166_1 } = item as {
        name?: unknown;
        iso_3166_1?: unknown;
      };
      if (typeof name === "string") return name;
      return typeof iso_3166_1 === "string" ? iso_3166_1 : "";
    })
    .filter(Boolean);
}

/** `Movie.actors` comes from the IMDb suggest API as a string, older rows hold an array. */
function actorsText(raw: unknown): string | null {
  if (typeof raw === "string") return raw || null;
  if (Array.isArray(raw)) {
    const names = raw.filter((a): a is string => typeof a === "string");
    return names.length > 0 ? names.join(", ") : null;
  }
  return null;
}

/**
 * Loads the static metadata of a movie (global, not cineforum-scoped).
 *
 * @param movieId - The `Movie.id`
 * @returns The movie info, or null if the movie does not exist
 */
export async function getMovieInfo(
  movieId: string,
): Promise<MovieInfoDTO | null> {
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    select: {
      id: true,
      title: true,
      year: true,
      runtime: true,
      releaseDate: true,
      tagline: true,
      overview: true,
      director: true,
      actors: true,
      genres: true,
      productionCountries: true,
      imdbId: true,
      homepage: true,
      poster: true,
      image: true,
      imageMedium: true,
      voteAverage: true,
      imdbRating: true,
      tomatometer: true,
      metascore: true,
    },
  });
  if (!movie) return null;

  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    runtime: movie.runtime,
    releaseDate: movie.releaseDate?.toISOString() ?? null,
    tagline: movie.tagline,
    overview: movie.overview,
    director: movie.director,
    actors: actorsText(movie.actors),
    genres: jsonNames(movie.genres),
    countries: jsonNames(movie.productionCountries),
    imdbId: movie.imdbId,
    homepage: movie.homepage,
    poster: movie.poster,
    image: movie.image,
    imageMedium: movie.imageMedium,
    tmdbVote: movie.voteAverage,
    imdbRating: movie.imdbRating,
    tomatometer: movie.tomatometer,
    metascore: movie.metascore,
  };
}
