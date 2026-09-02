import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Info, Search, Trophy } from "lucide-react";
import { UserPositionsTable } from "@/components/cineforum/rankings";
import { EmptyState } from "@/components/cineforum/common";
import type { UserPositionDTO } from "@/lib/shared/types";

type Props = {
  positions: UserPositionDTO[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

/** Positions tab: F1-style points leaderboard, with its own user search. */
export default function UsersPositionsSection({
  positions,
  searchQuery,
  onSearchChange,
}: Props) {
  const { t } = useTranslation("rankings");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return positions;
    const query = searchQuery.toLowerCase();
    return positions.filter((p) => p.user_name.toLowerCase().includes(query));
  }, [positions, searchQuery]);

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("users.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            hover:border-primary/50 transition-all duration-200 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8 text-muted-foreground" />}
          title={searchQuery ? t("users.noResults") : t("positions.emptyTitle")}
          subtitle={
            searchQuery
              ? t("users.noResultsQuery", { query: searchQuery })
              : t("positions.emptySubtitle")
          }
        />
      ) : (
        <UserPositionsTable data={filtered} />
      )}

      {/* How the score is computed */}
      <div className="mt-6 flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="h-fit shrink-0 rounded-lg bg-primary/10 p-2">
          <Info className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold text-foreground">
            {t("positions.metricTitle")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("positions.metricExplanation")}
          </p>
        </div>
      </div>
    </div>
  );
}
