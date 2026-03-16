// Rankings types

export type Supplier = {
  id: string;
  name: string;
};

export type MovieVoteDTO = {
  id: string;
  rating: number;
  user: string;
};

export type MovieRankingDTO = {
  id: string;
  average_rating: number | null;
  movie: string;
  movie_votes: MovieVoteDTO[];
  owner: string;
  round: string;
  round_winner: boolean;
  tmdb_vote: number | null;
  imdb_rating: number | null;
  tomatometer: number | null;
  metascore: number | null;
  tmdb_difference: string | null;
  imdb_difference: string | null;
  tomato_difference: string | null;
  meta_difference: string | null;
};

export type MovieRoundRankingDTO = {
  average_rating: number | null;
  movie: string;
  round_winner: boolean;
  round: string;
  tmdb_vote: number | null;
  imdb_rating: number | null;
  tomatometer: number | null;
  metascore: number | null;
};

export type UserRankingDTO = {
  id: string;
  average_rating: number | null;
  imdb_rating: number | null;
  tmdb_vote: number | null;
  tomatometer: number | null;
  metascore: number | null;
  movie_round_rankings: MovieRoundRankingDTO[];
  user: string;
  user_id: string;
};

export type MoviesRankingResponseDTO = {
  body: MovieRankingDTO[];
  status: string;
};

export type UsersRankingResponseDTO = {
  body: UserRankingDTO[];
  status: string;
};

export const SUPPLIERS: Supplier[] = [
  { id: "cineforum", name: "Cineforum" },
  { id: "tmdb", name: "TMDB" },
  { id: "imdb", name: "IMDB" },
  { id: "rotten_tomatoes", name: "Rotten Tomatoes" },
  { id: "metacritic", name: "Metacritic" },
];
