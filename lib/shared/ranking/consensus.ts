/**
 * Minimum number of member votes before a consensus spread (std dev) is
 * shown. Below this a single dissenting vote would dominate the figure.
 */
export const CONSENSUS_MIN_VOTES = 3;

/** Population standard deviation (divides by n, not n − 1); 0 for an empty list. */
export function populationStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, x) => s + x, 0) / values.length;
  const variance =
    values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
