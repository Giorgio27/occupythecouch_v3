import { Crown } from "lucide-react";
import { RankingCard } from "@/components/cineforum/rankings";
import UserRankingCardContent from "@/components/cineforum/rankings/UserRankingCardContent";
import type { UserRankingDTO, Supplier } from "@/lib/shared/types";

type CardViewMode = Record<string, "table" | "chart">;

type Props = {
  displayedRankings: UserRankingDTO[];
  sortedAndFilteredRankings: UserRankingDTO[];
  selectedSupplier: Supplier;
  expandedIndex: number | null;
  cardViewMode: CardViewMode;
  onToggleExpand: (index: number | null) => void;
  onSetCardMode: (userId: string, mode: "table" | "chart") => void;
  getRatingForSupplier: (ranking: UserRankingDTO) => number | null;
  getPosition: (index: number, ranking: UserRankingDTO) => number;
};

/** Cards (Griglia) view of user rankings: one expandable card per user. */
export default function UserRankingCards({
  displayedRankings,
  sortedAndFilteredRankings,
  selectedSupplier,
  expandedIndex,
  cardViewMode,
  onToggleExpand,
  onSetCardMode,
  getRatingForSupplier,
  getPosition,
}: Props) {
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
        const winningRounds = ranking.movie_round_rankings.filter(
          (mrr) => mrr.round_winner,
        );
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
            <UserRankingCardContent
              ranking={ranking}
              selectedSupplier={selectedSupplier}
              cardMode={cardViewMode[ranking.id] || "chart"}
              onSetCardMode={(mode) => onSetCardMode(ranking.id, mode)}
            />
          </RankingCard>
        );
      })}
    </div>
  );
}
