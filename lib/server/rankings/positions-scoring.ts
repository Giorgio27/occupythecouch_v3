import { toUserPositions } from "@/lib/server/rankings/weighted-score";
import type { UserPositionDTO } from "@/lib/shared/types";

/** F1-style points by 1-based rank; ranks beyond this list score 0. */
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export type ScoringRow = {
  roundId: string;
  averageRating: number | null;
  user: { id: string; name: string | null } | null;
  team: { users: { user: { id: string; name: string | null } }[] } | null;
};

/**
 * Ranks each round's rows by average rating (competition ranking — ties
 * share a place) and scores them with F1-style points; team-owned rows
 * credit every team member individually. Weighting/shaping into DTOs is
 * delegated to `toUserPositions`. Returns one entry per scoring user, sorted
 * by (raw) points descending.
 */
export function scorePositions(rows: ScoringRow[]): UserPositionDTO[] {
  const byRound = new Map<string, ScoringRow[]>();
  for (const r of rows) {
    const list = byRound.get(r.roundId) ?? [];
    list.push(r);
    byRound.set(r.roundId, list);
  }

  const stats = new Map<
    string,
    { name: string; positions: Map<number, number>; points: number }
  >();

  for (const entries of Array.from(byRound.values())) {
    const sorted = [...entries].sort(
      (a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0),
    );

    let rank = 0;
    let previousRating: number | null = null;
    sorted.forEach((entry, index) => {
      if (previousRating === null || entry.averageRating !== previousRating) {
        rank = index + 1;
      }
      previousRating = entry.averageRating;
      const points = rank <= F1_POINTS.length ? F1_POINTS[rank - 1] : 0;

      const owners = entry.user
        ? [entry.user]
        : (entry.team?.users.map((tu) => tu.user) ?? []);

      for (const owner of owners) {
        const current = stats.get(owner.id) ?? {
          name: owner.name ?? "Unknown",
          positions: new Map<number, number>(),
          points: 0,
        };
        current.positions.set(rank, (current.positions.get(rank) ?? 0) + 1);
        current.points += points;
        stats.set(owner.id, current);
      }
    });
  }

  return toUserPositions(stats);
}
