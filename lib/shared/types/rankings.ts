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
  /** ISO 8601 date string — membership createdAt (join date to this cineforum). */
  joined_at: string;
};

export type MoviesRankingResponseDTO = {
  body: MovieRankingDTO[];
  status: string;
};

export type UsersRankingResponseDTO = {
  body: UserRankingDTO[];
  status: string;
  total_movies_voted: number;
};

export const SUPPLIERS: Supplier[] = [
  { id: "cineforum", name: "Cineforum" },
  { id: "tmdb", name: "TMDB" },
  { id: "imdb", name: "IMDB" },
  { id: "rotten_tomatoes", name: "Rotten Tomatoes" },
  { id: "metacritic", name: "Metacritic" },
];

// User Statistics types
export type UserVoteDetailDTO = {
  movie: string;
  round: string;
  user_rating: number;
  movie_average: number;
  deviation: number;
  round_winner: boolean;
};

export type RatingDistributionDTO = {
  rating: number;
  count: number;
};

export type UserToUserComparisonDTO = {
  other_user_id: string;
  other_user_name: string;
  other_user_global_average: number | null;
  received_average_from_other: number | null;
  received_delta_vs_other_average: number | null;
  received_movies_count: number;
  given_average_to_other: number | null;
  given_delta_vs_other_average: number | null;
  given_movies_count: number;
};

export type LoveGivenDTO = {
  userId: string;
  userName: string;
  averageVote: number;
  averageRanking: number | null;
  count: number;
  votes: {
    rating: number;
    movieTitle: string;
    movieAverageVote: number;
    round: string;
  }[];
};

export type LoveReceivedDTO = {
  userId: string;
  userName: string;
  averageVote: number;
  count: number;
  votes: {
    rating: number;
    movieTitle: string;
    movieAverageVote: number;
    round: string;
  }[];
};

export type UserStatisticsDTO = {
  user_id: string;
  user_name: string;
  total_votes: number;
  average_rating: number | null;
  global_average: number | null;
  delta_from_global: number | null;
  standard_deviation: number | null;
  average_deviation_from_consensus: number | null;
  above_consensus_percentage: number | null;
  below_consensus_percentage: number | null;
  rating_distribution: RatingDistributionDTO[];
  most_deviant_movies: UserVoteDetailDTO[];
  vote_details: UserVoteDetailDTO[];
  user_comparisons: UserToUserComparisonDTO[];
  love_given: LoveGivenDTO[];
  love_received: LoveReceivedDTO[];
};

export type UserStatisticsResponseDTO = {
  body: UserStatisticsDTO;
  status: string;
};

// Split API response types
export type UserProfileStatsDTO = {
  user_id: string;
  user_name: string;
  total_votes: number;
  average_rating: number | null;
  global_average: number | null;
  delta_from_global: number | null;
  standard_deviation: number | null;
  average_deviation_from_consensus: number | null;
  above_consensus_percentage: number | null;
  below_consensus_percentage: number | null;
};

export type UserProfileStatsResponseDTO = {
  body: UserProfileStatsDTO;
  status: string;
};

export type LoveReceivedResponseDTO = {
  body: LoveReceivedDTO[];
  status: string;
};

export type LoveGivenResponseDTO = {
  body: LoveGivenDTO[];
  status: string;
};

export type RatingDistributionResponseDTO = {
  body: RatingDistributionDTO[];
  status: string;
};

export type DeviantMoviesResponseDTO = {
  body: UserVoteDetailDTO[];
  status: string;
};

// Similar users types

/** A user with similar cinematic taste to the target user. */
export type SimilarUserDTO = {
  userId: string;
  userName: string;
  score: number;
  pearson: number;
  commonRatings: number;
  compatibilityPercent: number;
  /** Average absolute difference between the two users' ratings on common films (0–4 scale) */
  avgAbsDiff: number;
  /** Proximity factor: 1 - avgAbsDiff/4. 1 = identical votes, 0 = maximally different */
  distancePenalty: number;
};

/** Detail of a single common movie vote between two users. */
export type CommonMovieVoteDTO = {
  movieId: string;
  movieTitle: string;
  targetRating: number;
  otherRating: number;
  delta: number;
};

export type SimilarUsersResponseDTO = {
  body: SimilarUserDTO[];
  status: string;
};

export type CommonMovieVotesResponseDTO = {
  body: CommonMovieVoteDTO[];
  status: string;
};

// Proposal user statistics types
export type ProposalUserStatDTO = {
  user_id: string;
  user_name: string;
  /** Total proposals attributed to the user: solo + team. */
  proposals_created: number;
  /** Proposals the user owns directly (not via a team). */
  proposals_created_solo: number;
  /** Proposals owned by teams the user belongs to. */
  proposals_created_team: number;
  proposals_voted: number;
  /**
   * Closed proposals (that received at least one vote) created after the user
   * joined that they never voted on, excluding proposals owned by the user or
   * one of their teams. The "at least one vote" rule excludes proposals from
   * before vote tracking existed, which had zero votes for everyone.
   */
  proposals_missed: number;
  avg_vote_delay_hours: number | null;
};

export type ProposalUserStatsResponseDTO = {
  body: ProposalUserStatDTO[];
  status: string;
  /** Authoritative total number of proposals (user- and team-owned). */
  total_created: number;
  /** Authoritative total number of proposal votes. */
  total_voted: number;
};

// Consensus types — how much the club agreed (or split) on a movie.
export type ConsensusMovieDTO = {
  /** MovieRoundRanking id (one entry per movie-in-round, like MovieRankingDTO). */
  id: string;
  movie: string;
  round: string;
  /** Proposer (user or team) name. */
  owner: string;
  /** Mean of member ratings. */
  average_rating: number;
  /** Population standard deviation of member ratings — the consensus axis. */
  std_dev: number;
  /** Lowest member rating. */
  min_rating: number;
  /** Highest member rating. */
  max_rating: number;
  /** Number of member votes counted. */
  vote_count: number;
  movie_votes: MovieVoteDTO[];
};

export type ConsensusResponseDTO = {
  body: ConsensusMovieDTO[];
  status: string;
  /** Minimum member votes required for a movie to appear. */
  min_votes: number;
};

// Timeline types
export type TimelineMovieDTO = {
  id: string;
  title: string;
  director: string | null;
  round: string;
  roundDate: string | null;
  poster: string | null;
  genres: unknown;
};

export type TimelineYearDTO = {
  year: number;
  count: number;
  movies: TimelineMovieDTO[];
};

export type TimelineResponseDTO = {
  body: TimelineYearDTO[];
  status: string;
};
