import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type StatCardProps = {
  /** Lucide icon node (already sized and colored by the caller) */
  icon: React.ReactNode;
  /**
   * Tailwind class for the icon container background.
   * @example "bg-primary/10" | "bg-blue-500/10" | "bg-green-500/10"
   */
  iconBg?: string;
  /** Short label shown above the value */
  label: string;
  /** The value to display. Pass null to render "N/A". */
  value: string | number | null;
  /**
   * Optional Tailwind class applied to the value text.
   * Use for delta coloring: "text-green-500" | "text-red-500"
   */
  valueClassName?: string;
  /** If provided, wraps the card in a Tooltip with this text */
  tooltip?: string;
};

function StatCardInner({
  icon,
  iconBg = "bg-primary/10",
  label,
  value,
  valueClassName,
}: Omit<StatCardProps, "tooltip">) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:bg-card">
      <div className={`shrink-0 rounded-lg p-2 ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p
          className={`truncate text-base font-bold tabular-nums sm:text-lg ${
            valueClassName ?? "text-foreground"
          }`}
        >
          {value !== null && value !== undefined ? value : "N/A"}
        </p>
      </div>
    </div>
  );
}

/**
 * Single stat card for summary grids.
 * Wrap multiple StatCards in a `grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4`.
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon={<Trophy className="w-5 h-5 text-primary" />}
 *   iconBg="bg-primary/10"
 *   label="Media"
 *   value={avg?.toFixed(2) ?? "N/A"}
 *   tooltip="La media di tutti i voti espressi."
 * />
 * ```
 */
export default function StatCard({ tooltip, ...rest }: StatCardProps) {
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <StatCardInner {...rest} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <StatCardInner {...rest} />;
}
