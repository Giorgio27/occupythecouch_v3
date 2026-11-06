import {
  buildBallotsFromMovieSelection,
  schulze,
} from "@/lib/server/ranking/schulze";
import type { MovieBallotDTO } from "@/lib/shared/types";

/** `ProposalVote.movieSelection`: rank → movie ids, ties allowed. */
type MovieSelection = Record<string, string[]>;

type ProposalVoteRow = {
  movieSelection: unknown;
  user: { name: string | null };
};

/** Narrows the `movieSelection` JSON column, dropping anything malformed. */
export function toMovieSelection(raw: unknown): MovieSelection {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const selection: MovieSelection = {};
  for (const [rank, ids] of Object.entries(raw)) {
    if (Array.isArray(ids)) {
      selection[rank] = ids.filter(
        (id): id is string => typeof id === "string",
      );
    }
  }
  return selection;
}

/** The rank a voter gave the movie, as shown to them; null if they left it unranked. */
function rankInSelection(
  selection: MovieSelection,
  movieId: string,
): number | null {
  const entry = Object.entries(selection).find(([, ids]) =>
    ids.includes(movieId),
  );
  if (!entry) return null;
  const rank = parseInt(entry[0], 10);
  return Number.isNaN(rank) ? null : rank;
}

/**
 * Schulze rank of a movie among a proposal's candidates, computed exactly like
 * the live proposal ranking. Null when nobody voted (every candidate would tie at 1).
 */
export function schulzeRankOf(
  movieId: string,
  candidateIds: string[],
  votes: ProposalVoteRow[],
): number | null {
  if (votes.length === 0) return null;
  const ballots = buildBallotsFromMovieSelection(
    votes.map((v) => ({ movieSelection: toMovieSelection(v.movieSelection) })),
    candidateIds,
  );
  return schulze(candidateIds, ballots).ranking[movieId] ?? null;
}

/**
 * Each voter's placement of the movie, best placement first and unranked last.
 */
export function toMovieBallots(
  movieId: string,
  votes: ProposalVoteRow[],
): MovieBallotDTO[] {
  return votes
    .map((v) => ({
      userName: v.user.name ?? "Unknown",
      rank: rankInSelection(toMovieSelection(v.movieSelection), movieId),
    }))
    .sort(
      (a, b) =>
        (a.rank ?? Number.MAX_SAFE_INTEGER) -
          (b.rank ?? Number.MAX_SAFE_INTEGER) ||
        a.userName.localeCompare(b.userName),
    );
}
