import { useTranslation } from "react-i18next";
import {
  Table as TableIcon,
  LineChart as LineChartIcon,
  CalendarDays,
} from "lucide-react";
import UserRankingTrendChart from "@/components/cineforum/rankings/UserRankingTrendChart";
import UserMoviesVotedList from "@/components/cineforum/rankings/UserMoviesVotedList";
import type { UserRankingDTO, Supplier } from "@/lib/shared/types";
import i18n from "@/lib/i18n";

type Props = {
  ranking: UserRankingDTO;
  selectedSupplier: Supplier;
  cardMode: "table" | "chart";
  onSetCardMode: (mode: "table" | "chart") => void;
};

/** Expanded content of a user's ranking card: movies/trend toggle, platform comparison, join date. */
export default function UserRankingCardContent({
  ranking,
  selectedSupplier,
  cardMode,
  onSetCardMode,
}: Props) {
  const { t } = useTranslation("rankings");

  const platformStats = [
    { label: "Cineforum", value: ranking.average_rating },
    { label: t("users.colWeightedAverage"), value: ranking.weighted_average_rating },
    { label: "TMDB", value: ranking.tmdb_vote },
    { label: "IMDB", value: ranking.imdb_rating },
    { label: "Rotten T.", value: ranking.tomatometer },
    { label: "Metacritic", value: ranking.metascore },
  ];

  return (
    <div className="space-y-6">
      {/* Chart / Table toggle */}
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-border overflow-hidden bg-card">
          <button
            onClick={() => onSetCardMode("chart")}
            className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-colors border-l border-border
              ${cardMode === "chart" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            {t("users.viewChart")}
          </button>
          <button
            onClick={() => onSetCardMode("table")}
            className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-colors
              ${cardMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            {t("users.viewTable")}
          </button>
        </div>
      </div>

      {/* Movies table */}
      {cardMode === "table" && (
        <UserMoviesVotedList movieRoundRankings={ranking.movie_round_rankings} />
      )}

      {/* Trend chart */}
      {cardMode === "chart" && (
        <UserRankingTrendChart ranking={ranking} supplier={selectedSupplier} />
      )}

      {/* Platform comparison mini-grid */}
      <div className="pt-4 border-t border-border">
        <h4 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          {t("users.platformComparison")}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {platformStats.map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="text-xs text-muted-foreground mb-1">
                {stat.label}
              </div>
              <div className="font-bold text-foreground tabular-nums">
                {stat.value?.toFixed(2) ?? "N/A"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Join date */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 w-fit">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("users.joinedLabel")}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {new Date(ranking.joined_at).toLocaleDateString(i18n.language, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
