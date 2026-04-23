import type { IncomingMessage } from "http";

const SUPPORTED_LOCALES = ["it", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "it";
const COOKIE_NAME = "i18nextLng";

/**
 * Reads the preferred locale from the request cookie.
 * Falls back to DEFAULT_LOCALE if the cookie is absent or unsupported.
 */
export function getLocaleFromRequest(req: IncomingMessage): SupportedLocale {
  const cookieHeader = req.headers.cookie ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!match) return DEFAULT_LOCALE;

  const value = match.split("=")[1]?.trim();
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as SupportedLocale)
    : DEFAULT_LOCALE;
}
