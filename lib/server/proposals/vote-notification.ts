/**
 * Builds the Telegram message text to send after a user votes on a proposal.
 *
 * Mirrors the Ruby `ProposalVote#to_telegram` logic:
 * - If some members have not yet voted → list the missing users and nudge them.
 * - If everyone has voted → show the final Schulze ranking.
 *
 * The message language is controlled by the `locale` parameter ("it" | "en").
 */

import {
  buildBallotsFromMovieSelection,
  schulze,
} from "@/lib/server/ranking/schulze";

export interface VoteNotificationMovie {
  id: string;
  title: string;
}

export interface VoteNotificationVote {
  movieSelection: Record<string, string[]> | null;
}

export interface VoteNotificationParams {
  /** Display name of the user who just voted. */
  voterName: string;
  /** True when the user is updating an existing vote. */
  alreadyVoted: boolean;
  /** Names of active members who have not yet voted. */
  missingUserNames: string[];
  /** All movies in the proposal (needed to compute the ranking). */
  movies: VoteNotificationMovie[];
  /** All current votes on the proposal (including the one just cast). */
  votes: VoteNotificationVote[];
  /** Cineforum locale: "it" (default) or "en". */
  locale?: string;
  /** Full URL to the proposal page (appended at the end of the message). */
  proposalUrl?: string;
}

/**
 * Returns the Telegram message text for a proposal vote event.
 *
 * @param params - Vote notification parameters.
 * @returns The formatted message string.
 */
export function buildVoteNotificationText(
  params: VoteNotificationParams,
): string {
  const {
    voterName,
    alreadyVoted,
    missingUserNames,
    movies,
    votes,
    locale = "it",
    proposalUrl,
  } = params;

  const isEn = locale === "en";

  if (missingUserNames.length > 0) {
    const rivoted = alreadyVoted ? (isEn ? "re-" : "ri-") : "";

    const lastLine = isEn
      ? missingUserNames.length === 1
        ? "what are you waiting for?"
        : "what are you all waiting for?"
      : missingUserNames.length === 1
        ? "cosa stai aspettando?"
        : "cosa state aspettando?";

    const votedLine = isEn
      ? `${voterName} has ${rivoted}voted!\n\n`
      : `${voterName} ha ${rivoted}votato!\n\n`;

    const urlSuffix = proposalUrl ? `\n\n${proposalUrl}` : "";
    return votedLine + `${missingUserNames.join("\n")}\n` + lastLine + urlSuffix;
  }

  // Everyone has voted — compute the Schulze ranking and show the final table.
  const candidates = movies.map((m) => m.id);
  const ballots = buildBallotsFromMovieSelection(
    votes.map((v) => ({
      movieSelection: (v.movieSelection as Record<string, string[]>) ?? {},
    })),
    candidates,
  );
  const result = schulze(candidates, ballots);

  const sortedMovies = [...movies].sort((a, b) => {
    const ra = result.ranking[a.id] ?? Infinity;
    const rb = result.ranking[b.id] ?? Infinity;
    return ra - rb;
  });

  let counter = 1;
  let previousRank: number | null = null;
  const movieLines = sortedMovies.map((m) => {
    const rank = result.ranking[m.id] ?? null;
    if (previousRank !== null && rank !== null && previousRank < rank) {
      counter += 1;
    }
    previousRank = rank;
    return `${counter}°) *${m.title}* rank: *${rank ?? "?"}*`;
  });

  const firstLine = isEn
    ? alreadyVoted
      ? `${voterName} has re-voted!\n`
      : `Finally ${voterName} has voted too!\n`
    : alreadyVoted
      ? `${voterName} ha ri-votato!\n`
      : `Finalmente anche ${voterName} ha votato!\n`;

  const rankingLabel = isEn
    ? "The final ranking is:\n"
    : "La classifica finale è:\n";

  const urlSuffix = proposalUrl ? `\n\n${proposalUrl}` : "";
  return firstLine + rankingLabel + movieLines.join("\n") + urlSuffix;
}
