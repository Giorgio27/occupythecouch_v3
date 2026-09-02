import UserRankingCards from "@/components/cineforum/rankings/UserRankingCards";
import UserRankingTable from "@/components/cineforum/rankings/UserRankingTable";
import type { UserRankingDTO, Supplier } from "@/lib/shared/types";

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

/** Picks the cards or table view of user rankings (non-delta mode). */
export default function UserRankingList({ viewMode, ...props }: Props) {
  if (viewMode === "cards") {
    return <UserRankingCards {...props} />;
  }
  return <UserRankingTable {...props} />;
}
