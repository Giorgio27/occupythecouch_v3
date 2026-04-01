"use client";

import { ChevronDown, Medal } from "lucide-react";
import { ReactNode } from "react";

type RankingCardProps = {
  position: number;
  title: string;
  rating: number | null;
  isExpanded: boolean;
  onToggle: () => void;
  badges?: ReactNode;
  children?: ReactNode;
};

// Get medal color for top 3 positions
function getMedalColor(position: number): string | null {
  switch (position) {
    case 1:
      return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
    case 2:
      return "text-gray-300 drop-shadow-[0_0_6px_rgba(209,213,219,0.4)]";
    case 3:
      return "text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]";
    default:
      return null;
  }
}

// Get position background for top 3
function getPositionBg(position: number): string {
  switch (position) {
    case 1:
      return "bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent";
    case 2:
      return "bg-gradient-to-r from-gray-400/15 via-gray-400/5 to-transparent";
    case 3:
      return "bg-gradient-to-r from-amber-600/15 via-amber-600/5 to-transparent";
    default:
      return "";
  }
}

export default function RankingCard({
  position,
  title,
  rating,
  isExpanded,
  onToggle,
  badges,
  children,
}: RankingCardProps) {
  const medalColor = getMedalColor(position);
  const positionBg = getPositionBg(position);

  return (
    <div
      className={`
        group cine-card overflow-hidden
        ${isExpanded ? "ring-1 ring-primary/40 border-primary/50" : ""}
      `}
    >
      <button
        onClick={onToggle}
        className={`
          w-full px-4 sm:px-6 py-4 sm:py-5 text-left transition-all duration-300
          hover:bg-secondary/50
          ${positionBg}
        `}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Position */}
          <div className="w-12 sm:w-16 flex items-center justify-center">
            {medalColor ? (
              <div className="relative">
                <Medal
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${medalColor} transition-transform group-hover:scale-110`}
                />
              </div>
            ) : (
              <span className="text-lg sm:text-xl font-bold text-muted-foreground tabular-nums">
                {position}
              </span>
            )}
          </div>

          {/* Title and badges */}
          <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
              {title}
            </span>
            {badges && <div className="flex-shrink-0">{badges}</div>}
          </div>

          {/* Rating */}
          <div className="w-16 sm:w-20 text-right">
            <span
              className={`
              font-bold text-base sm:text-lg tabular-nums
              ${rating !== null ? "text-gradient" : "text-muted-foreground"}
            `}
            >
              {rating !== null ? rating.toFixed(2) : "N/A"}
            </span>
          </div>

          {/* Expand/Collapse icon */}
          <div className="w-8 sm:w-10 flex justify-center">
            <div
              className={`
              p-1.5 rounded-lg transition-all duration-300
              ${isExpanded ? "bg-primary/20" : "bg-secondary group-hover:bg-primary/10"}
            `}
            >
              <ChevronDown
                className={`
                w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300
                ${isExpanded ? "text-primary rotate-180" : "text-muted-foreground group-hover:text-primary"}
              `}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded content with animation */}
      {isExpanded && children && (
        <div className="border-t border-border bg-secondary/30 animate-accordion-down overflow-hidden">
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      )}
    </div>
  );
}
