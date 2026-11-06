/**
 * Competition ranking ("1224"): sorts by score descending and gives tied
 * scores the same place, skipping the following places. Rows with a null
 * score are left out. Mirrors the ranking used by the F1 positions.
 *
 * @param rows - Items with an id and a nullable score
 * @returns Map from id to its 1-based rank
 */
export function competitionRanks(
  rows: { id: string; score: number | null }[],
): Map<string, number> {
  const scored = rows
    .filter((r): r is { id: string; score: number } => r.score !== null)
    .sort((a, b) => b.score - a.score);

  const ranks = new Map<string, number>();
  let rank = 0;
  let previous: number | null = null;
  scored.forEach((row, index) => {
    if (row.score !== previous) rank = index + 1;
    previous = row.score;
    ranks.set(row.id, rank);
  });
  return ranks;
}
