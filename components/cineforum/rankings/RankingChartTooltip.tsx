import { Trophy } from "lucide-react";

export type RankingChartPoint = {
  index: number;
  round: string;
  roundIndexLabel: string;
  xLabel: string;
  rating: number | null;
  movie: string;
  winner: boolean;
};

type RankingChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: RankingChartPoint }>;
};

export function RankingChartTooltip({
  active,
  payload,
}: RankingChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point || point.rating === null) return null;

  return (
    <div
      className="min-w-55 max-w-70 rounded-2xl p-3.5"
      style={{
        backgroundColor: "var(--popover)",
        border: "1px solid var(--border)",
        color: "var(--popover-foreground)",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-[11px] sm:text-xs text-muted-foreground">
          {point.roundIndexLabel} • {point.round}
        </div>
        {point.winner && (
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-500">
            <Trophy className="w-3.5 h-3.5" />
            Winner
          </div>
        )}
      </div>
      <div className="text-sm font-semibold text-foreground leading-snug mb-3">
        {point.movie}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">Voto medio</span>
        <span className="text-sm font-bold text-primary tabular-nums">
          {point.rating.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

type RankingChartDotProps = {
  cx?: number;
  cy?: number;
  payload?: RankingChartPoint;
  isMobile?: boolean;
};

export function RankingChartDot({
  cx,
  cy,
  payload,
  isMobile,
}: RankingChartDotProps) {
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    !payload ||
    payload.rating === null
  ) {
    return null;
  }

  const isWinner = payload.winner;
  if (isMobile && !isWinner) return null;

  const dotRadius = isMobile ? 3.5 : 4.5;
  const winnerRadius = isMobile ? 6 : 8;

  return (
    <g>
      {isWinner && (
        <circle
          cx={cx}
          cy={cy}
          r={winnerRadius}
          fill="rgba(234, 179, 8, 0.12)"
          stroke="rgba(234, 179, 8, 0.55)"
          strokeWidth={1.5}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={dotRadius}
        fill="var(--primary)"
        stroke="var(--background)"
        strokeWidth={2}
      />
    </g>
  );
}
