export type DirectorMovie = {
  title: string;
  average_rating: number;
};

export type DirectorRankingDTO = {
  name: string;
  count: number;
  average_rating: number;
  movies: DirectorMovie[];
};
