// Movie detail page — everything one cineforum knows about one movie.

import type { MovieOscarsDTO, MoviePendingOscarsDTO } from "./movieOscars";

/** Static movie metadata; external ratings are kept on their native /10 scale. */
export type MovieInfoDTO = {
  id: string;
  title: string;
  year: number | null;
  runtime: number | null;
  releaseDate: string | null;
  tagline: string | null;
  overview: string | null;
  director: string | null;
  actors: string | null;
  genres: string[];
  countries: string[];
  imdbId: string | null;
  homepage: string | null;
  poster: string | null;
  image: string | null;
  imageMedium: string | null;
  tmdbVote: number | null;
  imdbRating: number | null;
  tomatometer: number | null;
  metascore: number | null;
};

export type MovieAppearanceStatus = "won" | "lost" | "open";

/** One member's placement of this movie in a proposal ballot (null = left unranked). */
export type MovieBallotDTO = { userName: string; rank: number | null };

/** One proposal of the cineforum that included this movie. */
export type MovieAppearanceDTO = {
  proposalId: string;
  proposalTitle: string;
  date: string | null;
  roundName: string;
  owner: string;
  status: MovieAppearanceStatus;
  /** Title of the movie that won instead, when this one lost. */
  winnerTitle: string | null;
  candidateCount: number;
  voterCount: number;
  /** Schulze rank among the candidates; null while the proposal is open. */
  schulzeRank: number | null;
  /** Individual ballots; null unless the proposal is closed and shows results. */
  ballots: MovieBallotDTO[] | null;
};

/** Another movie by the same director proposed in this cineforum. */
export type MovieRelatedDTO = {
  id: string;
  title: string;
  year: number | null;
  averageRating: number | null;
};

export type MovieDetailDTO = {
  movie: MovieInfoDTO;
  appearances: MovieAppearanceDTO[];
  oscars: MovieOscarsDTO[];
  pendingOscars: MoviePendingOscarsDTO[];
  sameDirector: MovieRelatedDTO[];
};
