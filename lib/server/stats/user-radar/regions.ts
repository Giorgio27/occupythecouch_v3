import type { RegionKey } from "@/lib/shared/types";

// Areas tuned for cinema rather than plain continents: Africa, Oceania and
// Latin America alone would be near-empty axes, so they share "global_south".
const REGION_CODES: Record<Exclude<RegionKey, "global_south">, string[]> = {
  north_america: ["US", "CA"],
  western_europe: [
    "GB", "IE", "FR", "DE", "IT", "ES", "PT", "NL", "BE", "LU", "CH", "AT",
    "DK", "SE", "NO", "FI", "IS", "GR", "MT", "CY", "MC", "LI", "SM", "VA", "AD",
  ],
  eastern_europe: [
    "RU", "SU", "PL", "CZ", "CS", "XC", "SK", "HU", "RO", "BG", "RS", "YU",
    "HR", "SI", "BA", "ME", "MK", "XK", "AL", "UA", "BY", "MD", "LT", "LV",
    "EE", "GE", "AM", "AZ", "DD", "XG",
  ],
  east_asia: ["JP", "KR", "KP", "CN", "HK", "TW", "MO", "MN"],
  rest_of_asia: [
    "IN", "PK", "BD", "LK", "NP", "BT", "IR", "IQ", "IL", "PS", "JO", "LB",
    "SY", "TR", "SA", "AE", "QA", "KW", "BH", "OM", "YE", "AF", "KZ", "UZ",
    "TM", "KG", "TJ", "TH", "VN", "PH", "ID", "MY", "SG", "KH", "LA", "MM",
    "BN", "TL",
  ],
};

const REGION_BY_CODE = new Map<string, RegionKey>(
  Object.entries(REGION_CODES).flatMap(([region, codes]) =>
    codes.map((code): [string, RegionKey] => [code, region as RegionKey]),
  ),
);

// Defunct countries TMDB still uses, mapped to today's country for display.
const HISTORIC_TO_CURRENT: Record<string, string> = {
  SU: "RU",
  CS: "CZ",
  XC: "CZ",
  YU: "RS",
  DD: "DE",
  XG: "DE",
};

// TMDB English names that differ from ICU's, for rows stored as plain names.
const NAME_ALIASES: Record<string, string> = {
  "united states of america": "US",
  "soviet union": "SU",
  czechoslovakia: "XC",
  "czech republic": "CZ",
  "east germany": "DD",
  yugoslavia: "YU",
  "serbia and montenegro": "CS",
  "hong kong": "HK",
  "south korea": "KR",
  "north korea": "KP",
  taiwan: "TW",
  macao: "MO",
  "palestinian territory": "PS",
  russia: "RU",
};

let codeByName: Map<string, string> | null = null;

/** Lazily builds an English name → ISO code lookup from ICU region names. */
function getCodeByName(): Map<string, string> {
  if (codeByName) return codeByName;
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const map = new Map<string, string>(Object.entries(NAME_ALIASES));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const a of letters) {
    for (const b of letters) {
      const code = `${a}${b}`;
      const name = names.of(code);
      if (name && name !== code && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), code);
      }
    }
  }
  codeByName = map;
  return map;
}

/** Turns one `productionCountries` entry (TMDB object, code or name) into a code. */
function toCode(item: unknown): string | null {
  if (typeof item === "object" && item !== null) {
    const { iso_3166_1: iso, name } = item as { iso_3166_1?: unknown; name?: unknown };
    if (typeof iso === "string" && iso.length === 2) return iso.toUpperCase();
    return typeof name === "string" ? toCode(name) : null;
  }
  if (typeof item !== "string" || item.trim() === "") return null;
  if (/^[A-Za-z]{2}$/.test(item)) return item.toUpperCase();
  return getCodeByName().get(item.trim().toLowerCase()) ?? null;
}

/**
 * Parses the `Movie.productionCountries` JSONB (TMDB `{ iso_3166_1, name }[]`,
 * or plain names/codes from older imports) into distinct ISO codes.
 */
export function parseCountryCodes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const codes = raw.map(toCode).filter((c): c is string => c !== null);
  return Array.from(new Set(codes));
}

/** Radar area of an ISO country code; anything unlisted is "global_south". */
export function regionOf(code: string): RegionKey {
  return REGION_BY_CODE.get(code) ?? "global_south";
}

/** Today's country for a defunct one (e.g. SU → RU), for flags and names. */
export function toCurrentCountry(code: string): string {
  return HISTORIC_TO_CURRENT[code] ?? code;
}
