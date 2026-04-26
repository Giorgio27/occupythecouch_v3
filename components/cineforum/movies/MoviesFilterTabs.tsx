import { useTranslation } from "react-i18next";

export type MovieFilter = "all" | "watched" | "unwatched";

type MoviesFilterTabsProps = {
  value: MovieFilter;
  onChange: (value: MovieFilter) => void;
  counts: { all: number; watched: number; unwatched: number };
};

const TABS: { key: MovieFilter; labelKey: string }[] = [
  { key: "all", labelKey: "moviesList.filterAll" },
  { key: "watched", labelKey: "moviesList.filterWatched" },
  { key: "unwatched", labelKey: "moviesList.filterUnwatched" },
];

export default function MoviesFilterTabs({
  value,
  onChange,
  counts,
}: MoviesFilterTabsProps) {
  const { t } = useTranslation("rankings");

  return (
    <div className="flex rounded-xl border border-border overflow-hidden bg-card">
      {TABS.map((tab, i) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 sm:flex-none px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors
            ${i > 0 ? "border-l border-border" : ""}
            ${
              value === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
        >
          {t(tab.labelKey)}
          <span
            className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full font-bold
              ${
                value === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
          >
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}
