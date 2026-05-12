import { useTranslation } from "react-i18next";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Film,
} from "lucide-react";
import { SupplierSelect } from "@/components/cineforum/rankings";
import type { Supplier } from "@/lib/shared/types";

type Props = {
  suppliers: Supplier[];
  selectedSupplier: Supplier;
  onSupplierChange: (supplier: Supplier) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: "cards" | "table";
  onViewModeChange: (mode: "cards" | "table") => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  allRounds: string[];
  roundRange: [number, number];
  onRoundRangeChange: (range: [number, number]) => void;
};

/** Controls bar: supplier selector, search input, view toggle, and round-range filter. */
export default function SupplierSelectBar({
  suppliers,
  selectedSupplier,
  onSupplierChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  allRounds,
  roundRange,
  onRoundRangeChange,
}: Props) {
  const { t } = useTranslation("rankings");

  return (
    <div
      className="flex flex-col gap-4 mb-6 animate-fade-in-up"
      style={{ animationDelay: "200ms" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <SupplierSelect
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          onSupplierChange={onSupplierChange}
        />

        <div className="flex-1 flex gap-3 lg:justify-end">
          {/* Search */}
          <div className="relative flex-1 lg:flex-initial lg:w-64">
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

          {/* Filters toggle */}
          {allRounds.length > 1 && (
            <button
              onClick={onToggleFilters}
              className={`px-3 lg:px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200
                ${
                  showFilters
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-card text-foreground hover:bg-secondary hover:border-primary/50"
                }`}
              title={t("users.filters")}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden lg:inline">{t("users.filters")}</span>
            </button>
          )}

          {/* Cards / Table toggle (hidden in delta mode) */}
          {selectedSupplier.id !== "delta" && (
            <div className="flex rounded-xl border border-border overflow-hidden bg-card">
              <button
                onClick={() => onViewModeChange("cards")}
                className={`px-3 lg:px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors
                  ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                title={t("users.viewCards")}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden lg:inline">{t("users.viewCards")}</span>
              </button>
              <button
                onClick={() => onViewModeChange("table")}
                className={`px-3 lg:px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-l border-border
                  ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                title={t("users.viewTable")}
              >
                <List className="w-4 h-4" />
                <span className="hidden lg:inline">{t("users.viewTable")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Round range filter */}
      {showFilters && allRounds.length > 1 && (
        <div className="cine-card p-4 animate-fade-in">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
            <Film className="w-4 h-4 text-primary" />
            {t("users.filterByRound")}
            <span className="text-primary font-bold">
              {allRounds[roundRange[0] - 1]} → {allRounds[roundRange[1] - 1]}
            </span>
          </label>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                {t("users.filterFrom")}{" "}
                <span className="font-medium text-foreground">
                  {allRounds[roundRange[0] - 1]}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max={allRounds.length}
                value={roundRange[0]}
                onChange={(e) => {
                  const newStart = parseInt(e.target.value);
                  onRoundRangeChange([
                    newStart,
                    Math.max(newStart, roundRange[1]),
                  ]);
                }}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                {t("users.filterTo")}{" "}
                <span className="font-medium text-foreground">
                  {allRounds[roundRange[1] - 1]}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max={allRounds.length}
                value={roundRange[1]}
                onChange={(e) => {
                  const newEnd = parseInt(e.target.value);
                  onRoundRangeChange([Math.min(roundRange[0], newEnd), newEnd]);
                }}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{allRounds[0]}</span>
              <span>{allRounds[allRounds.length - 1]}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
