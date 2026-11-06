// Movie detail page — the Oscars (0–5 rating) side of a movie.

export type MovieOscarVoteDTO = {
  userId: string;
  userName: string;
  rating: number;
};

/** The Oscars outcome of this movie in one closed round. */
export type MovieOscarsDTO = {
  roundId: string;
  roundName: string;
  owner: string;
  averageRating: number | null;
  roundWinner: boolean;
  /** Competition rank among the round's proposals (ties share a place). */
  roundPosition: number | null;
  roundSize: number;
  /** Competition rank among every movie watched in closed rounds. */
  overallRank: number | null;
  overallTotal: number;
  /** Population std dev of the ratings; null below the consensus vote minimum. */
  stdDev: number | null;
  votes: MovieOscarVoteDTO[];
};

/** Oscars vote still running in an open round: only counts, never other members' votes. */
export type MoviePendingOscarsDTO = {
  roundId: string;
  roundName: string;
  voteCount: number;
  myRating: number | null;
};
