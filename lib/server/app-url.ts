/**
 * Absolute URL of an app path, for links sent outside the app (Telegram).
 * Uses `NEXTAUTH_URL`, like the "new proposal" message; null when it is unset
 * so callers can skip the link instead of sending a relative one.
 *
 * @param path - App path starting with "/"
 */
export function absoluteAppUrl(path: string): string | null {
  const base = process.env.NEXTAUTH_URL?.replace(/\/+$/, "");
  return base ? `${base}${path}` : null;
}
