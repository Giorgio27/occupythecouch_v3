import { useState } from "react";
import { useTranslation } from "react-i18next";
import SortableTh from "@/components/cineforum/rankings/SortableTh";
import UserRankingTableRow from "@/components/cineforum/rankings/UserRankingTableRow";
import type { UserRankingDTO } from "@/lib/shared/types";

type SortKey = "user" | "rating" | "weighted" | "movies" | "wins";

type Props = {
  displayedRankings: UserRankingDTO[];
  getRatingForSupplier: (ranking: UserRankingDTO) => number | null;
};

const winsFor = (ranking: UserRankingDTO): number =>
  ranking.movie_round_rankings.filter((mrr) => mrr.round_winner).length;

/** Table (Tabella) view of user rankings — every column is independently sortable. */
export default function UserRankingTable({
  displayedRankings,
  getRatingForSupplier,
}: Props) {
  const { t } = useTranslation("rankings");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortAsc, setSortAsc] = useState(false);

  const columns: { key: SortKey; label: string; align?: "left" }[] = [
    { key: "user", label: t("users.colUser"), align: "left" },
    { key: "rating", label: t("users.colAverage") },
    { key: "weighted", label: t("users.colWeightedAverage") },
    { key: "movies", label: t("users.colMovies") },
    { key: "wins", label: t("users.colWins") },
  ];

  const getValue = (ranking: UserRankingDTO, key: SortKey): number | string => {
    switch (key) {
      case "user":
        return ranking.user;
      case "rating":
        return getRatingForSupplier(ranking) ?? -1;
      case "weighted":
        return ranking.weighted_average_rating ?? -1;
      case "movies":
        return ranking.movie_round_rankings.length;
      case "wins":
        return winsFor(ranking);
    }
  };

  const sorted = [...displayedRankings].sort((a, b) => {
    const av = getValue(a, sortKey);
    const bv = getValue(b, sortKey);
    if (typeof av === "string" && typeof bv === "string")
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === "user");
    }
  };

  return (
    <div
      className="cine-card-fit overflow-hidden animate-fade-in-up"
      style={{ animationDelay: "300ms" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2.5 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border-b border-border">
                #
              </th>
              {columns.map((col) => (
                <SortableTh
                  key={col.key}
                  label={col.label}
                  align={col.align}
                  active={sortKey === col.key}
                  sortAsc={sortAsc}
                  onClick={() => toggle(col.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((ranking, index) => (
              <UserRankingTableRow
                key={ranking.id}
                ranking={ranking}
                position={index + 1}
                rating={getRatingForSupplier(ranking)}
                wins={winsFor(ranking)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
