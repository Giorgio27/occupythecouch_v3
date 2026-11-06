/**
 * Converts an external platform rating stored on a /10 scale to the club's
 * /5 Oscars scale, rounded to two decimals.
 */
export function toFiveScale(value: number | null): number | null {
  if (value === null) return null;
  return Math.round((value / 2) * 100) / 100;
}
