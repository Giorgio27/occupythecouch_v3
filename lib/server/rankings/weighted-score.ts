import type { UserPositionDTO } from "@/lib/shared/types";

type UserStats = {
  name: string;
  positions: Map<number, number>;
  points: number;
};

/**
 * Bayesian/IMDB-style shrinkage: blends a user's own total (accumulated over
 * `n` samples) toward a club-wide `prior` per-sample average, weighted by a
 * `confidence` constant — a small `n` pulls hard toward the prior, a large
 * `n` barely moves from the user's own rate.
 */
function shrinkTotal(
  total: number,
  n: number,
  prior: number,
  confidence: number,
): number {
  return (confidence * prior + total) / (confidence + n);
}

export type Totals = { sum: number; n: number };

/**
 * Computes a Bayesian/IMDB-style weighted average per key from raw (sum, n)
 * totals: each key's own rate (sum/n) is blended toward the group-wide rate
 * (all keys combined), weighted by a confidence constant — the average n
 * across keys that have at least one sample. A small n pulls hard toward
 * the group rate, a large n barely moves from the key's own rate. Keys with
 * n = 0 are omitted from the result.
 */
export function computeWeightedAverages(
  perKey: Map<string, Totals>,
): Map<string, number> {
  const scored = Array.from(perKey.entries()).filter(([, t]) => t.n > 0);
  const grandSum = scored.reduce((sum, [, t]) => sum + t.sum, 0);
  const grandN = scored.reduce((sum, [, t]) => sum + t.n, 0);
  const prior = grandN > 0 ? grandSum / grandN : 0;
  const confidence = scored.length > 0 ? grandN / scored.length : 0;

  return new Map(
    scored.map(([key, t]) => [key, shrinkTotal(t.sum, t.n, prior, confidence)]),
  );
}

/**
 * Shapes raw per-user position stats into `UserPositionDTO`s, adding a
 * `weighted_score` via `computeWeightedAverages` — each user's
 * points-per-proposal, shrunk toward the club-wide average — so proposing a
 * lot without great results can't outrank a smaller but consistently
 * strong track record. Sorted by (raw) points descending.
 */
export function toUserPositions(
  stats: Map<string, UserStats>,
): UserPositionDTO[] {
  const totals = new Map<string, Totals>();
  for (const [userId, s] of Array.from(stats.entries())) {
    const n = Array.from(s.positions.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    totals.set(userId, { sum: s.points, n });
  }
  const weighted = computeWeightedAverages(totals);

  return Array.from(stats.entries())
    .map(([userId, s]) => ({
      user_id: userId,
      user_name: s.name,
      points: s.points,
      positions: Object.fromEntries(s.positions),
      total_participations: totals.get(userId)!.n,
      weighted_score: Math.round((weighted.get(userId) ?? 0) * 10) / 10,
    }))
    .sort((a, b) => b.points - a.points);
}
