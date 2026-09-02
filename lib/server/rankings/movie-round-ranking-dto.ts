import type { MovieRoundRankingDTO } from "@/lib/shared/types";

type UrmRow = {
  movieRoundRanking: {
    averageRating: number | null;
    roundWinner: boolean;
    movie: {
      title: string;
      voteAverage: number | null;
      imdbRating: number | null;
      tomatometer: number | null;
      metascore: number | null;
    };
    round: { name: string };
  };
};

/** Normalizes an external-site value (0-10 scale) down to the app's 0-5 scale. */
function supplierVote(value: number | null | undefined): number | null {
  if (value == null) return null;
  return parseFloat((value / 2.0).toFixed(2));
}

/**
 * Maps a `UserRankingMovieRoundRanking` join row (with its nested movie and
 * round relations) to a `MovieRoundRankingDTO`.
 */
export function toMovieRoundRankingDTO(urm: UrmRow): MovieRoundRankingDTO {
  const mrr = urm.movieRoundRanking;
  return {
    average_rating: mrr.averageRating,
    movie: mrr.movie.title,
    round_winner: mrr.roundWinner,
    round: mrr.round.name,
    tmdb_vote: supplierVote(mrr.movie.voteAverage),
    imdb_rating: supplierVote(mrr.movie.imdbRating),
    tomatometer: supplierVote(mrr.movie.tomatometer),
    metascore: supplierVote(mrr.movie.metascore),
  };
}
