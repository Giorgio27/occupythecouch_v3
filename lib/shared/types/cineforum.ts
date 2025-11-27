// src/types/cineforum.ts

// Movie as returned inside proposal detail.
export type ProposalMovieDTO = {
  id: string;
  title: string;
  year: number | null;
  image?: string | null;
  imageMedium?: string | null;
  runtime?: number | null;
  director?: string | null;
  actors?: string | null;
  link?: string | null;
  // add other fields only if you really use them in the UI
};

export type ProposalVoteDTO = {
  id: string;
  user: { id: string; name?: string };
  movie_selection: Record<string, string[]>; // rank -> movie IDs
};

export type ProposalDetailDTO = {
  id: string;
  date: string | null;
  owner: { id: string; type: "User" | "Team" } | null;
  movies: ProposalMovieDTO[];
  winner: ProposalMovieDTO | null;
  closed: boolean;
  votes: ProposalVoteDTO[];
  created_at: string;
  description: string | null;
  title: string;
  round: string | null;
  missing_users: string[];
  no_votes_left: boolean;
  show_results: boolean;
};

// Ranking API: { votes: [...], sorted_movies: [...] }
export type ProposalRankingMovieDTO = ProposalMovieDTO & {
  proposal_rank: number;
};

export type ProposalRankingDTO = {
  votes: ProposalVoteDTO[];
  sorted_movies: ProposalRankingMovieDTO[];
};

export type RoundSummaryDTO = {
  id: string;
  name: string;
  date: string | null;
  closed: boolean;
  oscarable: boolean;
  chooser?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

// IMDb suggestion (semplificato) — quello che ti torna dal suggest
export type ImdbSuggestionDTO = {
  id: string; // imdb id
  l: string; // title
  y?: number; // year
  s?: string; // subtitle (actors...)
  q?: string; // kind ("feature", "TV episode", ...)
  i?: string[]; // [smallImg, largeImg]
};
