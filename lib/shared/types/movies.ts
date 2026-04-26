export type MovieStatsDTO = {
  id: string;
  title: string;
  proposals: number;
  wins: number;
  defeats: number;
  // enriched fields
  imageMedium: string | null;
  image: string | null;
  poster: string | null;
  imdbId: string | null;
  year: number | null;
  overview: string | null;
  director: string | null;
  genres: string[];
  round_name: string | null; // name of the round in which the movie was watched (wins > 0)
};

export type MoviesListResponseDTO = {
  body: MovieStatsDTO[];
  status: string;
};
