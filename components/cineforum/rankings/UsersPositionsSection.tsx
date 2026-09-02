import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Trophy } from "lucide-react";
import { UserPositionsTable } from "@/components/cineforum/rankings";
import { EmptyState, InfoNote } from "@/components/cineforum/common";
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

      <InfoNote
        className="mt-6"
        title={t("positions.metricTitle")}
        paragraphs={[
          t("positions.metricExplanation"),
          t("positions.weightedExplanation"),
        ]}
      />
    </div>
  );
}
