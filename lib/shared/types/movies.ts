export type MovieStatsDTO = {
  id: string;
  title: string;
  proposals: number;
  wins: number;
  defeats: number;
};

export type MoviesListResponseDTO = {
  body: MovieStatsDTO[];
  status: string;
};
