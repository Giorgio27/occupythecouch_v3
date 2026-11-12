import { useTranslation } from "react-i18next";
import type { CountryCountDTO } from "@/lib/shared/types";

type TopCountriesProps = {
  countries: CountryCountDTO[];
};

function countryName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * "United States 12 · Japan 7 …" chips under the regions hexagon. No flag
 * emoji: Windows renders them as bare letters ("US").
 */
export default function TopCountries({ countries }: TopCountriesProps) {
  const { t, i18n } = useTranslation("stats");
  if (countries.length === 0) return null;

  return (
    <div className="mt-2 pt-3 border-t border-border">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {t("radar.topCountries")}
      </p>
      <ul className="flex flex-wrap gap-2">
        {countries.map(({ code, count }) => (
          <li
            key={code}
            className="flex min-w-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs"
          >
            <span className="truncate text-foreground">
              {countryName(code, i18n.language)}
            </span>
            <span className="font-bold tabular-nums text-primary">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
