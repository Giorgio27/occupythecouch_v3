import { useTranslation } from "react-i18next";
import {
  Trophy,
  Crown,
  Film,
  Table as TableIcon,
  LineChart as LineChartIcon,
  CalendarDays,
} from "lucide-react";
import { RankingCard } from "@/components/cineforum/rankings";
import UserRankingTrendChart from "@/components/cineforum/rankings/UserRankingTrendChart";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/cineforum/common/EmptyState";
import type {
  UserRankingDTO,
  MovieRoundRankingDTO,
  Supplier,
} from "@/lib/shared/types";
import i18n from "@/lib/i18n";

type CardViewMode = Record<string, "table" | "chart">;

type Props = {
  displayedRankings: UserRankingDTO[];
  sortedAndFilteredRankings: UserRankingDTO[];
  selectedSupplier: Supplier;
  viewMode: "cards" | "table";
  expandedIndex: number | null;
  cardViewMode: CardViewMode;
  onToggleExpand: (index: number | null) => void;
  onSetCardMode: (userId: string, mode: "table" | "chart") => void;
  getRatingForSupplier: (ranking: UserRankingDTO) => number | null;
  getPosition: (index: number, ranking: UserRankingDTO) => number;
};

/** Renders the cards or table view of user rankings (non-delta mode). */
export default function UserRankingList({
  displayedRankings,
  sortedAndFilteredRankings,
  selectedSupplier,
  viewMode,
  expandedIndex,
  cardViewMode,
  onToggleExpand,
  onSetCardMode,
  getRatingForSupplier,
  getPosition,
}: Props) {
  const { t } = useTranslation("rankings");

  const getWinningRounds = (ranking: UserRankingDTO): MovieRoundRankingDTO[] =>
    ranking.movie_round_rankings.filter((mrr) => mrr.round_winner);

  const getCardViewModeFor = (userId: string): "table" | "chart" =>
    cardViewMode[userId] || "chart";

  if (viewMode === "cards") {
    return (
      <div
        className="space-y-3 animate-fade-in-up"
        style={{ animationDelay: "300ms" }}
      >
        {displayedRankings.map((ranking) => {
          const globalIndex = sortedAndFilteredRankings.findIndex(
            (r) => r.id === ranking.id,
          );
          const isExpanded = expandedIndex === globalIndex;
          const rating = getRatingForSupplier(ranking);
          const winningRounds = getWinningRounds(ranking);
          const position = getPosition(globalIndex, ranking);

          return (
            <RankingCard
              key={ranking.id}
              position={position}
              title={ranking.user}
              rating={rating}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpand(isExpanded ? null : globalIndex)}
              badges={
                winningRounds.length > 0 ? (
                  <div className="relative inline-flex items-center">
                    <Crown className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]" />
                    {winningRounds.length > 1 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {winningRounds.length}
                      </span>
                    )}
                  </div>
                ) : null
              }
            >
              <div className="space-y-6">
                {/* Chart / Table toggle */}
                <div className="flex justify-end">
                  <div className="flex rounded-lg border border-border overflow-hidden bg-card">
                    <button
                      onClick={() => onSetCardMode(ranking.id, "chart")}
                      className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-colors border-l border-border
                        ${getCardViewModeFor(ranking.id) === "chart" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                    >
                      <LineChartIcon className="w-3.5 h-3.5" />
                      {t("users.viewChart")}
                    </button>
                    <button
                      onClick={() => onSetCardMode(ranking.id, "table")}
                      className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-colors
                        ${getCardViewModeFor(ranking.id) === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      {t("users.viewTable")}
                    </button>
                  </div>
                </div>

                {/* Movies table */}
                {getCardViewModeFor(ranking.id) === "table" && (
                  <div>
                    <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                      <Film className="w-4 h-4" />
                      {t("users.moviesVoted")}
                    </h3>

                    {ranking.movie_round_rankings.length === 0 ? (
                      <EmptyState
                        title={t("users.noMoviesVoted")}
                        subtitle={t("users.noMoviesVotedSubtitle")}
                      />
                    ) : (
                      <div className="space-y-2">
                        {ranking.movie_round_rankings.map((mrr, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-medium text-foreground truncate">
                                {mrr.movie}
                              </span>
                              {mrr.round_winner && (
                                <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-sm flex items-center gap-3 shrink-0 ml-4">
                              <span className="font-bold text-gradient tabular-nums">
                                {mrr.average_rating?.toFixed(2) ?? "N/A"}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {mrr.round}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Trend chart */}
                {getCardViewModeFor(ranking.id) === "chart" && (
                  <UserRankingTrendChart
                    ranking={ranking}
                    supplier={selectedSupplier}
                  />
                )}

                {/* Platform comparison mini-grid */}
                <div className="pt-4 border-t border-border">
                  <h4 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                    {t("users.platformComparison")}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { label: "Cineforum", value: ranking.average_rating },
                      { label: "TMDB", value: ranking.tmdb_vote },
                      { label: "IMDB", value: ranking.imdb_rating },
                      { label: "Rotten T.", value: ranking.tomatometer },
                      { label: "Metacritic", value: ranking.metascore },
                    ].map((stat) => (
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
            </RankingCard>
          );
        })}
      </div>
    );
  }

  // Table view
  return (
    <div
      className="cine-card-fit overflow-hidden animate-fade-in-up"
      style={{ animationDelay: "300ms" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("users.colUser")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("users.colAverage")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("users.colMovies")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("users.colWins")}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedRankings.map((ranking) => {
              const globalIndex = sortedAndFilteredRankings.findIndex(
                (r) => r.id === ranking.id,
              );
              const rating = getRatingForSupplier(ranking);
              const position = getPosition(globalIndex, ranking);
              const wins = getWinningRounds(ranking).length;

              return (
                <tr
                  key={ranking.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-4 py-3.5 text-sm font-bold text-muted-foreground tabular-nums">
                    {position}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {ranking.user}
                      {wins > 0 && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums">
                    {rating !== null ? (
                      <span className="text-gradient">{rating.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-right text-muted-foreground tabular-nums">
                    {ranking.movie_round_rankings.length}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-right tabular-nums">
                    {wins > 0 ? (
                      <span className="text-yellow-500 font-bold">{wins}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
