import * as React from "react";
import { ChevronDown } from "lucide-react";

type ExpandableListItemProps = {
  /**
   * Position indicator. Pass a number for plain text, or a ReactNode for
   * custom rendering (e.g. a Medal icon for top-3 positions).
   */
  position?: number | React.ReactNode;
  /** Main label. Can be a string or a ReactNode for rich content. */
  title: string | React.ReactNode;
  /** Optional badges / status pills rendered after the title */
  badges?: React.ReactNode;
  /** Primary metric shown on the right (e.g. rating, count) */
  metric?: string | React.ReactNode;
  /** Tailwind class applied to the metric text. Defaults to "text-foreground". */
  metricClassName?: string;
  /** Whether the expanded panel is currently visible */
  isExpanded: boolean;
  /** Called when the row is clicked */
  onToggle: () => void;
  /** Content rendered inside the expanded panel */
  children?: React.ReactNode;
  /**
   * Optional Tailwind gradient class applied to the row background.
   * Used for top-3 highlight: "bg-linear-to-r from-yellow-500/20 via-yellow-500/5 to-transparent"
   */
  highlightBg?: string;
  /** Staggered entrance delay in ms */
  animationDelay?: number;
  className?: string;
};

/**
 * Reusable expandable list row.
 *
 * Structure: [ position ] [ title + badges ] [ metric ] [ chevron ]
 *            ↓ expanded panel (border-t, bg-secondary/30)
 *
 * Domain logic (medal colors, position backgrounds, etc.) stays in the caller.
 * This component only owns layout and expand/collapse animation.
 *
 * @example
 * ```tsx
 * <ExpandableListItem
 *   position={1}
 *   title="Blade Runner 2049"
 *   metric="8.42"
 *   metricClassName="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent"
 *   isExpanded={isExpanded}
 *   onToggle={onToggle}
 *   highlightBg="bg-linear-to-r from-yellow-500/20 via-yellow-500/5 to-transparent"
 *   animationDelay={0}
 * >
 *   <p className="text-sm text-muted-foreground">Dettagli...</p>
 * </ExpandableListItem>
 * ```
 */
export default function ExpandableListItem({
  position,
  title,
  badges,
  metric,
  metricClassName = "text-foreground",
  isExpanded,
  onToggle,
  children,
  highlightBg,
  animationDelay,
  className = "",
}: ExpandableListItemProps) {
  return (
    <div
      className={`group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:bg-card animate-fade-in-up ${
        isExpanded ? "ring-1 ring-primary/40 border-primary/50" : ""
      } ${className}`}
      style={
        animationDelay !== undefined
          ? { animationDelay: `${animationDelay}ms` }
          : undefined
      }
    >
      {/* Clickable row */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-4 text-left transition-all duration-300 hover:bg-secondary/50 sm:px-6 sm:py-5 ${
          highlightBg ?? ""
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Position */}
          {position !== undefined && (
            <div className="flex w-12 shrink-0 items-center justify-center sm:w-16">
              {typeof position === "number" ? (
                <span className="text-lg font-bold tabular-nums text-muted-foreground sm:text-xl">
                  {position}
                </span>
              ) : (
                position
              )}
            </div>
          )}

          {/* Title + badges */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
              {title}
            </span>
            {badges && <div className="shrink-0">{badges}</div>}
          </div>

          {/* Metric */}
          {metric !== undefined && (
            <div
              className={
                typeof metric === "string"
                  ? "w-16 shrink-0 text-right sm:w-20"
                  : "shrink-0"
              }
            >
              {typeof metric === "string" ? (
                <span
                  className={`text-base font-bold tabular-nums sm:text-lg ${metricClassName}`}
                >
                  {metric}
                </span>
              ) : (
                metric
              )}
            </div>
          )}

          {/* Chevron */}
          <div className="flex w-8 shrink-0 justify-center sm:w-10">
            <div
              className={`rounded-lg p-1.5 transition-all duration-300 ${
                isExpanded
                  ? "bg-primary/20"
                  : "bg-secondary group-hover:bg-primary/10"
              }`}
            >
              <ChevronDown
                className={`h-4 w-4 transition-all duration-300 sm:h-5 sm:w-5 ${
                  isExpanded
                    ? "rotate-180 text-primary"
                    : "text-muted-foreground group-hover:text-primary"
                }`}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && children && (
        <div className="animate-accordion-down overflow-hidden border-t border-border bg-secondary/30">
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      )}
    </div>
  );
}
