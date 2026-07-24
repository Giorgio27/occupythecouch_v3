// Determines whether the current votes have already "clinched" the winner of a
// proposal, i.e. whether the leading movie is guaranteed to stay the winner no
// matter how the remaining enabled members vote.
//
// The proposal winner is decided with the Schulze method (see
// lib/server/ranking/schulze.ts). Deciding the exact set of "possible winners"
// under Schulze given some undecided ballots is intractable in general, so we
// use a *sound* (never falsely positive) sufficient condition based on pairwise
// margins:
//
//   The current leader W is guaranteed to remain the unique winner if W beats
//   every other candidate X pairwise by a margin strictly greater than the
//   number of remaining ballots R.
//
// Why this holds: each remaining ballot can shift the pairwise margin
// (d[W][X] - d[X][W]) by at most 1 in X's favour (by ranking X above W). So
// after R adversarial ballots the margin is still ≥ (margin - R). If that stays
// positive against every X, W remains a strict Condorcet winner — and a strict
// Condorcet winner is always the unique Schulze winner.
//
// This can report "not locked" for a winner that is in fact locked (e.g. a
// Schulze winner that wins via beat-paths without being a Condorcet winner),
// but it will never claim a winner is locked when it could still be overturned.

type VoteLike = { movie_selection: Record<string, string[]> };

export type VoteLockResult = {
  /** Remaining enabled members who have not voted yet. */
  remaining: number;
  /** True when the outcome can no longer change. */
  locked: boolean;
  /**
   * The movie guaranteed to win, when one exists (current strict Condorcet
   * winner). Null when there is no clear leader yet (e.g. a tie / cycle).
   */
  winnerId: string | null;
  /**
   * Smallest pairwise margin of `winnerId` over any other candidate, when a
   * Condorcet winner exists. Null otherwise.
   */
  minMargin: number | null;
};

/**
 * Build the Schulze pairwise "beats" matrix d, where d[i][j] is the number of
 * ballots ranking candidate i strictly above candidate j. Mirrors the ballot
 * handling in lib/server/ranking/schulze.ts: unranked candidates are all tied
 * at the bottom, below every ranked group.
 */
function buildPairwiseMatrix(
  votes: VoteLike[],
  candidates: string[],
): number[][] {
  const n = candidates.length;
  const d = Array.from({ length: n }, () => Array(n).fill(0));

  for (const vote of votes) {
    const selection = vote.movie_selection ?? {};
    const rankKeys = Object.keys(selection)
      .map((k) => parseInt(k, 10))
      .filter((k) => !Number.isNaN(k))
      .sort((a, b) => a - b);

    // rankIndex: candidate -> group position (lower is better).
    const rankIndex = new Map<string, number>();
    rankKeys.forEach((rank, groupPos) => {
      for (const id of selection[String(rank)] ?? []) {
        if (candidates.includes(id) && !rankIndex.has(id)) {
          rankIndex.set(id, groupPos);
        }
      }
    });
    const bottom = rankKeys.length;
    for (const c of candidates) if (!rankIndex.has(c)) rankIndex.set(c, bottom);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (rankIndex.get(candidates[i])! < rankIndex.get(candidates[j])!) {
          d[i][j] += 1;
        }
      }
    }
  }

  return d;
}

/**
 * Compute whether the winner is already decided given the votes cast so far and
 * the number of enabled members still to vote.
 *
 * @param votes      Ballots cast so far (rank -> movie ids).
 * @param candidates Movie ids in the proposal.
 * @param remaining  Enabled members who have not voted yet (>= 0).
 */
export function computeVoteLock(
  votes: VoteLike[],
  candidates: string[],
  remaining: number,
): VoteLockResult {
  const safeRemaining = Math.max(0, remaining);

  // A single candidate always wins.
  if (candidates.length <= 1) {
    return {
      remaining: safeRemaining,
      locked: true,
      winnerId: candidates[0] ?? null,
      minMargin: null,
    };
  }

  const n = candidates.length;
  const d = buildPairwiseMatrix(votes, candidates);

  // Find a strict Condorcet winner: beats every other candidate pairwise.
  let winnerIdx = -1;
  let minMargin = 0;
  for (let i = 0; i < n; i++) {
    let worst = Infinity;
    let beatsAll = true;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const margin = d[i][j] - d[j][i];
      if (margin <= 0) {
        beatsAll = false;
        break;
      }
      if (margin < worst) worst = margin;
    }
    if (beatsAll) {
      winnerIdx = i;
      minMargin = worst;
      break;
    }
  }

  // No current leader (tie or cycle at the top): outcome is decided only if
  // nobody is left to vote.
  if (winnerIdx === -1) {
    return {
      remaining: safeRemaining,
      locked: safeRemaining === 0,
      winnerId: null,
      minMargin: null,
    };
  }

  // With no ballots left the current result is final; otherwise the lead is
  // locked only when it cannot be overturned by the remaining ballots.
  const locked = safeRemaining === 0 || minMargin > safeRemaining;

  return {
    remaining: safeRemaining,
    locked,
    winnerId: candidates[winnerIdx],
    minMargin,
  };
}
