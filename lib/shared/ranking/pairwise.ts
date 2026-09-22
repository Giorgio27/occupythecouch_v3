// Pairwise (head-to-head) tallies shared by the Schulze winner computation and
// by the admin "is the winner already decided?" indicator.

export type VoteLike = { movie_selection: Record<string, string[]> };

export type PairwiseMargin = {
  /** Candidate leading this head-to-head (the first one, on a tie). */
  winnerId: string;
  loserId: string;
  /** Ballots ranking `winnerId` strictly above `loserId`. */
  winnerVotes: number;
  /** Ballots ranking `loserId` strictly above `winnerId`. */
  loserVotes: number;
  /** winnerVotes - loserVotes, always >= 0. */
  margin: number;
};

/**
 * Build the Schulze pairwise "beats" matrix d, where d[i][j] is the number of
 * ballots ranking candidate i strictly above candidate j. Mirrors the ballot
 * handling in lib/server/ranking/schulze.ts: unranked candidates are all tied
 * at the bottom, below every ranked group.
 */
export function buildPairwiseMatrix(
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
 * Flatten a pairwise matrix into one oriented row per pair of candidates,
 * tightest confrontation first — the tight ones are those the remaining
 * ballots could still overturn.
 */
export function collectPairwiseMargins(
  d: number[][],
  candidates: string[],
): PairwiseMargin[] {
  const rows: PairwiseMargin[] = [];

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const leads = d[i][j] >= d[j][i];
      const [w, l] = leads ? [i, j] : [j, i];
      rows.push({
        winnerId: candidates[w],
        loserId: candidates[l],
        winnerVotes: d[w][l],
        loserVotes: d[l][w],
        margin: d[w][l] - d[l][w],
      });
    }
  }

  return rows.sort((a, b) => a.margin - b.margin);
}
