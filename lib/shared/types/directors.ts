export type DirectorMovie = {
  /** `Movie.id`, for linking to the movie page. */
  movie_id: string;
  title: string;
  average_rating: number;
};

export type DirectorRankingDTO = {
  name: string;
  count: number;
  average_rating: number;
  movies: DirectorMovie[];
};
