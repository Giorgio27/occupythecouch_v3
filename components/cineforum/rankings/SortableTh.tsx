import { ChevronUp, ChevronDown } from "lucide-react";

export type ThSticky = "left" | "right";

export const STICKY_CLASSES: Record<ThSticky, string> = {
  left: "sticky left-0 z-10 border-r",
  right: "sticky right-0 z-10 border-l",
};

type Props = {
  label: string;
  align?: "left" | "center";
  sticky?: ThSticky;
  active: boolean;
  sortAsc: boolean;
  onClick: () => void;
};

/** Sortable table header cell, with an optional sticky (horizontally pinned) column. */
export default function SortableTh({
  label,
  align = "center",
  sticky,
  active,
  sortAsc,
  onClick,
}: Props) {
  return (
    <th
      className={`px-2 py-2.5 sm:px-3 sm:py-3 text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors bg-muted/40 border-border ${
        align === "left" ? "text-left" : "text-center"
      } ${sticky ? STICKY_CLASSES[sticky] : ""}`}
      onClick={onClick}
    >
      <span
        className={`flex items-center gap-1 ${align === "left" ? "" : "justify-center"}`}
      >
        {label}
        {active ? (
          sortAsc ? (
            <ChevronUp className="w-3 h-3 shrink-0" />
          ) : (
            <ChevronDown className="w-3 h-3 shrink-0" />
          )
        ) : (
          <ChevronDown className="w-3 h-3 shrink-0 opacity-30" />
        )}
      </span>
    </th>
  );
}
