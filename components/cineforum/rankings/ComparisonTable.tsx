import { TrendingUp, TrendingDown, Minus, Globe } from "lucide-react";

type ComparisonRow = {
  label: string;
  value: number | null;
  difference?: string | null;
};

type ComparisonTableProps = {
  title: string;
  rows: ComparisonRow[];
};

// Parse difference string to determine trend
function parseDifference(
  diff: string | null | undefined,
): { value: number; trend: "up" | "down" | "neutral" } | null {
  if (!diff) return null;
  const numValue = parseFloat(diff);
  if (isNaN(numValue)) return null;
  return {
    value: Math.abs(numValue),
    trend: numValue > 0 ? "up" : numValue < 0 ? "down" : "neutral",
  };
}

export default function ComparisonTable({ title, rows }: ComparisonTableProps) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
        <Globe className="w-4 h-4" />
        {title}
      </h3>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-secondary/50 px-4 py-3 border-b border-border">
          <div className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <div className="flex-1">Sito</div>
            <div className="w-20 sm:w-24 text-right">Voto</div>
            <div className="w-20 sm:w-24 text-right">Diff</div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {rows.map((row, index) => {
            const diffData = parseDifference(row.difference);
            const isFirst = index === 0; // Cineforum row

            return (
              <div
                key={row.label}
                className={`
                  flex items-center px-4 py-3 sm:py-4 transition-colors
                  hover:bg-secondary/30
                  ${isFirst ? "bg-primary/5" : ""}
                `}
              >
                {/* Label */}
                <div className="flex-1 flex items-center gap-2">
                  <span
                    className={`text-sm sm:text-base ${isFirst ? "font-bold text-primary" : "text-foreground"}`}
                  >
                    {row.label}
                  </span>
                  {isFirst && (
                    <span className="cine-badge text-xs py-0.5 px-2">Noi</span>
                  )}
                </div>

                {/* Value */}
                <div className="w-20 sm:w-24 text-right">
                  <span
                    className={`
                    font-bold text-sm sm:text-base
                    ${row.value !== null ? (isFirst ? "text-primary" : "text-foreground") : "text-muted-foreground"}
                  `}
                  >
                    {row.value !== null ? row.value.toFixed(2) : "N/A"}
                  </span>
                </div>

                {/* Difference */}
                <div className="w-20 sm:w-24 text-right">
                  {diffData ? (
                    <div
                      className={`
                      inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full
                      ${
                        diffData.trend === "up"
                          ? "text-green-400 bg-green-400/10"
                          : diffData.trend === "down"
                            ? "text-red-400 bg-red-400/10"
                            : "text-muted-foreground bg-secondary"
                      }
                    `}
                    >
                      {diffData.trend === "up" && (
                        <TrendingUp className="w-3 h-3" />
                      )}
                      {diffData.trend === "down" && (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {diffData.trend === "neutral" && (
                        <Minus className="w-3 h-3" />
                      )}
                      <span>{diffData.value.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
