import type { MovieWinnerDTO } from "@/lib/shared/types";

/** Movie fields selected for the oscars preview. */
export type PreviewMovie = {
  id: string;
  title: string;
  year: number | null;
  actors: unknown;
  image: string | null;
  imageMedium: string | null;
  poster: string | null;
  overview: string | null;
  imdbRating: number | null;
  voteAverage: number | null;
  tomatometer: number | null;
  metascore: number | null;
};

/** A single MovieVote joined with its author, as selected for the preview. */
export type PreviewVote = {
  movieId: string;
  rating: number;
  user: { id: string; name: string | null };
};

/** A winner proposal with its owner, as selected for the preview. */
export type PreviewProposal = {
  winner: PreviewMovie | null;
  ownerUser: { name: string | null } | null;
  ownerTeam: { name: string } | null;
};

/**
 * Maps a winner proposal and the round's votes into a MovieWinnerDTO carrying the
 * current partial average rating and per-user votes.
 *
 * @param proposal - A proposal whose winner movie is set
 * @param votes - All MovieVotes for the round (filtered per movie inside)
 * @param userId - The requesting user's id (used to surface their own vote)
 */
export function toMovieWinner(
  proposal: PreviewProposal,
  votes: PreviewVote[],
  userId: string,
): MovieWinnerDTO {
  const movie = proposal.winner!;
  const movieVotes = votes.filter((v) => v.movieId === movie.id);
  const roundRating =
    movieVotes.length > 0
      ? Math.round(
          (movieVotes.reduce((sum, v) => sum + v.rating, 0) /
            movieVotes.length) *
            100,
        ) / 100
      : null;

  const proposer = proposal.ownerTeam
    ? proposal.ownerTeam.name
    : proposal.ownerUser?.name || "Unknown";

  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    actors:
      typeof movie.actors === "string"
        ? movie.actors
        : Array.isArray(movie.actors)
          ? movie.actors.join(", ")
          : "",
    image: movie.image,
    imageMedium: movie.imageMedium,
    poster: movie.poster,
    overview: movie.overview,
    roundRating,
    roundVotes: movieVotes.map((v) => ({
      user: v.user.id,
      userName: v.user.name,
      rating: v.rating,
    })),
    userRating: movieVotes.find((v) => v.user.id === userId)?.rating ?? null,
    proposer,
    imdbRating: movie.imdbRating ?? null,
    tmdbVote: movie.voteAverage ?? null,
    tomatometer: movie.tomatometer ?? null,
    metascore: movie.metascore ?? null,
  };
}
