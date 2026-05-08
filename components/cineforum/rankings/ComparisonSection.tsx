import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { UserRankingDTO, Supplier } from "@/lib/shared/types";

type DeltaSortColumn =
  | "user"
  | "cineforum"
  | "tmdb"
  | "imdb"
  | "rotten_tomatoes"
  | "metacritic";

const externalSuppliers: Supplier[] = [
  { id: "tmdb", name: "TMDB" },
  { id: "imdb", name: "IMDB" },
  { id: "rotten_tomatoes", name: "Rotten Tomatoes" },
  { id: "metacritic", name: "Metacritic" },
];

type Props = {
  displayedRankings: UserRankingDTO[];
  getPosition: (index: number, ranking: UserRankingDTO) => number;
  sortedAndFilteredRankings: UserRankingDTO[];
};

/** Platform comparison (delta) table shown when the "Confronto Piattaforme" supplier is selected. */
export default function ComparisonSection({
  displayedRankings,
  getPosition,
  sortedAndFilteredRankings,
}: Props) {
  const { t } = useTranslation("rankings");

  const [deltaSortBy, setDeltaSortBy] = useState<DeltaSortColumn>("user");
  const [deltaSortDir, setDeltaSortDir] = useState<"asc" | "desc">("asc");

  const toggleDeltaSort = useCallback(
    (column: DeltaSortColumn) => {
      if (deltaSortBy === column) {
        setDeltaSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setDeltaSortBy(column);
        setDeltaSortDir("desc");
      }
    },
    [deltaSortBy],
  );

  const renderSortIcon = (column: DeltaSortColumn) => {
    if (column !== deltaSortBy) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    }
    return deltaSortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1" />
    );
  };

  const sortedRankings = useMemo(() => {
    return [...displayedRankings].sort((a, b) => {
      let comparison = 0;

      if (deltaSortBy === "user") {
        comparison = a.user.localeCompare(b.user);
      } else if (deltaSortBy === "cineforum") {
        comparison =
          (a.average_rating ?? -Infinity) - (b.average_rating ?? -Infinity);
      } else {
        const cineforumA = a.average_rating ?? 0;
        const cineforumB = b.average_rating ?? 0;

        let supplierA = 0;
        let supplierB = 0;

        switch (deltaSortBy) {
          case "tmdb":
            supplierA = a.tmdb_vote ?? 0;
            supplierB = b.tmdb_vote ?? 0;
            break;
          case "imdb":
            supplierA = a.imdb_rating ?? 0;
            supplierB = b.imdb_rating ?? 0;
            break;
          case "rotten_tomatoes":
            supplierA = a.tomatometer ?? 0;
            supplierB = b.tomatometer ?? 0;
            break;
          case "metacritic":
            supplierA = a.metascore ?? 0;
            supplierB = b.metascore ?? 0;
            break;
        }

        comparison = cineforumA - supplierA - (cineforumB - supplierB);
      }

      return deltaSortDir === "asc" ? comparison : -comparison;
    });
  }, [displayedRankings, deltaSortBy, deltaSortDir]);

  const getSupplierRating = (
    ranking: UserRankingDTO,
    supplierId: string,
  ): number | null => {
    switch (supplierId) {
      case "tmdb":
        return ranking.tmdb_vote;
      case "imdb":
        return ranking.imdb_rating;
      case "rotten_tomatoes":
        return ranking.tomatometer;
      case "metacritic":
        return ranking.metascore;
      default:
        return null;
    }
  };

  const deltaColorClass = (delta: number | null): string => {
    if (delta === null) return "text-muted-foreground";
    if (delta > 0.5) return "text-green-600";
    if (delta > 0.1) return "text-green-500";
    if (delta < -0.5) return "text-red-600";
    if (delta < -0.1) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <div
      className="cine-card-fit overflow-hidden mt-8 animate-fade-in-up"
      style={{ animationDelay: "400ms" }}
    >
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-amber-500/5">
        <h2 className="font-black text-xl text-foreground tracking-tight flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          {t("users.comparisonTitle")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("users.comparisonSubtitle")}{" "}
          <span className="text-green-500 font-semibold">
            {t("users.positiveValues")}
          </span>{" "}
          indicano che Cineforum vota più alto,{" "}
          <span className="text-red-500 font-semibold">
            {t("users.negativeValues")}
          </span>{" "}
          indicano che Cineforum vota più basso.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-secondary/50 z-10 cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleDeltaSort("user")}
              >
                <div className="flex items-center">
                  {t("users.colUser")}
                  {renderSortIcon("user")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleDeltaSort("cineforum")}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <span>Cineforum</span>
                    {renderSortIcon("cineforum")}
                  </div>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {t("users.referenceLabel")}
                  </span>
                </div>
              </th>
              {externalSuppliers.map((supplier) => (
                <th
                  key={supplier.id}
                  className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-l border-border cursor-pointer hover:text-primary transition-colors"
                  colSpan={2}
                  onClick={() =>
                    toggleDeltaSort(supplier.id as DeltaSortColumn)
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{supplier.name}</span>
                    {renderSortIcon(supplier.id as DeltaSortColumn)}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-normal">
                    <span className="text-foreground">
                      {t("users.colMedia")}
                    </span>
                    <span className="text-amber-500">
                      {t("users.colDeltaLabel")}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRankings.map((ranking) => {
              const cineforumRating = ranking.average_rating;
              const position = getPosition(
                sortedAndFilteredRankings.findIndex((r) => r.id === ranking.id),
                ranking,
              );

              return (
                <tr
                  key={ranking.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors group"
                >
                  <td className="px-4 py-3.5 text-sm font-medium text-foreground sticky left-0 bg-card group-hover:bg-secondary/30 transition-colors z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-bold tabular-nums w-6">
                        {position}.
                      </span>
                      {ranking.user}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center bg-primary/5">
                    <span className="text-sm font-bold text-primary tabular-nums">
                      {cineforumRating !== null
                        ? cineforumRating.toFixed(2)
                        : "N/A"}
                    </span>
                  </td>
                  {externalSuppliers.map((supplier) => {
                    const supplierRating = getSupplierRating(
                      ranking,
                      supplier.id,
                    );
                    const delta =
                      supplierRating !== null && cineforumRating !== null
                        ? cineforumRating - supplierRating
                        : null;

                    return (
                      <td
                        key={supplier.id}
                        className="border-l border-border"
                        colSpan={2}
                      >
                        <div className="flex items-center justify-center gap-4 px-4 py-3.5">
                          <span className="text-sm font-semibold text-foreground tabular-nums w-14 text-center">
                            {supplierRating !== null
                              ? supplierRating.toFixed(2)
                              : "N/A"}
                          </span>
                          <span
                            className={`text-sm font-bold tabular-nums w-16 text-center ${deltaColorClass(delta)}`}
                          >
                            {delta !== null ? (
                              <>
                                {delta > 0 ? "+" : ""}
                                {delta.toFixed(2)}
                              </>
                            ) : (
                              "—"
                            )}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-primary/30 bg-gradient-to-r from-primary/10 to-amber-500/10">
              <td className="px-4 py-4 text-sm font-bold text-foreground sticky left-0 bg-gradient-to-r from-primary/10 to-amber-500/10 z-10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {t("users.globalAverage")}
                </div>
              </td>
              <td className="px-4 py-4 text-center bg-primary/10">
                <span className="text-sm font-bold text-primary tabular-nums">
                  {(() => {
                    const valid = sortedRankings
                      .map((r) => r.average_rating)
                      .filter((r): r is number => r !== null);
                    return valid.length > 0
                      ? (
                          valid.reduce((a, b) => a + b, 0) / valid.length
                        ).toFixed(2)
                      : "N/A";
                  })()}
                </span>
              </td>
              {externalSuppliers.map((supplier) => {
                const supplierRatings = sortedRankings
                  .map((r) => getSupplierRating(r, supplier.id))
                  .filter((r): r is number => r !== null);

                const cineforumRatings = sortedRankings
                  .map((r) => r.average_rating)
                  .filter((r): r is number => r !== null);

                const avgSupplier =
                  supplierRatings.length > 0
                    ? supplierRatings.reduce((a, b) => a + b, 0) /
                      supplierRatings.length
                    : null;

                const avgCineforum =
                  cineforumRatings.length > 0
                    ? cineforumRatings.reduce((a, b) => a + b, 0) /
                      cineforumRatings.length
                    : null;

                const delta =
                  avgSupplier !== null && avgCineforum !== null
                    ? avgCineforum - avgSupplier
                    : null;

                return (
                  <td
                    key={supplier.id}
                    className="border-l border-border"
                    colSpan={2}
                  >
                    <div className="flex items-center justify-center gap-4 px-4 py-4">
                      <span className="text-sm font-bold text-foreground tabular-nums w-14 text-center">
                        {avgSupplier !== null ? avgSupplier.toFixed(2) : "N/A"}
                      </span>
                      <span
                        className={`text-sm font-black tabular-nums w-16 text-center ${deltaColorClass(delta)}`}
                      >
                        {delta !== null ? (
                          <>
                            {delta > 0 ? "+" : ""}
                            {delta.toFixed(2)}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border bg-secondary/20">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-foreground">
            {t("users.deltaLegend")}
          </span>
          {[
            { color: "bg-green-600", label: t("users.deltaHighDesc") },
            { color: "bg-green-500", label: t("users.deltaHighMedDesc") },
            {
              color: "bg-muted-foreground",
              label: t("users.deltaNeutralDesc"),
            },
            { color: "bg-red-500", label: t("users.deltaLowMedDesc") },
            { color: "bg-red-600", label: t("users.deltaLowDesc") },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
