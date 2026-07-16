import prisma from "@/lib/prisma";
import type { GenreStatDTO, GenreMovieDTO } from "@/lib/shared/types";

/**
 * Normalizes the `Movie.genres` JSONB field, which may be stored either as a
 * plain `string[]` or as TMDB's `{ id, name }[]`, into a clean list of names.
 * Mirrors the parsing in the movies list API.
 */
function normalizeGenres(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .map((g) => (typeof g === "string" ? g : ((g as { name?: string }).name ?? "")))
    .filter(Boolean);
}

/**
 * Aggregates the cineforum's screened (winning) movies by genre, reporting both
 * how much each genre was explored (count) and how much the club liked it
 * (average of the movies' club ratings).
 *
 * A movie with several genres contributes to each of them, so the sum of counts
 * exceeds the number of unique films (returned separately as `total_films`).
 *
 * @param cineforumId - The cineforum identifier
 * @returns Genre rows sorted by count (desc) and the unique film total
 */
export async function getGenreStats(
  cineforumId: string,
): Promise<{ body: GenreStatDTO[]; totalFilms: number }> {
  const [proposals, rankings] = await Promise.all([
    prisma.proposal.findMany({
      where: { cineforumId, closed: true, winnerId: { not: null } },
      select: {
        roundId: true,
        winnerId: true,
        winner: {
          select: {
            id: true,
            title: true,
            director: true,
            poster: true,
            imageMedium: true,
            image: true,
            imdbId: true,
            genres: true,
          },
        },
        round: { select: { name: true, date: true } },
      },
      orderBy: [{ round: { date: "asc" } }, { date: "asc" }],
    }),
    // Club average rating per (round, movie), same source as the movies ranking.
    prisma.movieRoundRanking.findMany({
      where: { round: { cineforumId, closed: true } },
      select: { roundId: true, movieId: true, averageRating: true },
    }),
  ]);

  const ratingByRoundMovie = new Map<string, number | null>();
  for (const r of rankings) {
    ratingByRoundMovie.set(`${r.roundId}:${r.movieId}`, r.averageRating);
  }

  type Acc = {
    genre: string;
    count: number;
    ratingSum: number;
    ratingCount: number;
    movies: GenreMovieDTO[];
  };
  const genreMap = new Map<string, Acc>();
  let totalFilms = 0;

  for (const p of proposals) {
    if (!p.winner) continue;
    totalFilms++;

    const genres = normalizeGenres(p.winner.genres);
    const rating =
      p.winnerId != null
        ? (ratingByRoundMovie.get(`${p.roundId}:${p.winnerId}`) ?? null)
        : null;

    const movie: GenreMovieDTO = {
      id: p.winner.id,
      title: p.winner.title,
      director: p.winner.director,
      poster: p.winner.poster,
      imageMedium: p.winner.imageMedium,
      image: p.winner.image,
      imdbId: p.winner.imdbId,
      round: p.round.name,
      roundDate: p.round.date ? p.round.date.toISOString() : null,
      rating: rating != null ? Math.round(rating * 100) / 100 : null,
    };

    for (const genre of genres) {
      let acc = genreMap.get(genre);
      if (!acc) {
        acc = { genre, count: 0, ratingSum: 0, ratingCount: 0, movies: [] };
        genreMap.set(genre, acc);
      }
      acc.count++;
      acc.movies.push(movie);
      if (rating != null) {
        acc.ratingSum += rating;
        acc.ratingCount++;
      }
    }
  }

  const body: GenreStatDTO[] = Array.from(genreMap.values())
    .map((a) => ({
      genre: a.genre,
      count: a.count,
      average_rating:
        a.ratingCount > 0
          ? Math.round((a.ratingSum / a.ratingCount) * 100) / 100
          : null,
      movies: a.movies,
    }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));

  return { body, totalFilms };
}
