import { useEffect, useMemo, useState } from "react";
import { LineChart as LineChartIcon, Sparkles, Trophy } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import EmptyState from "@/components/cineforum/common/EmptyState";
import type { UserRankingDTO } from "@/lib/shared/types";

type Props = {
  ranking: UserRankingDTO;
};

type RankingChartPoint = {
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
  payload?: Array<{
    payload: RankingChartPoint;
  }>;
};

const sortRounds = (a: string, b: string) =>
  a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });

const RankingChartTooltip = ({ active, payload }: RankingChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point || point.rating === null) return null;

  return (
    <div
      className="min-w-[220px] max-w-[280px] rounded-2xl p-3.5"
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
};

const RankingChartDot = (props: {
  cx?: number;
  cy?: number;
  payload?: RankingChartPoint;
}) => {
  const { cx, cy, payload } = props;

  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    !payload ||
    payload.rating === null
  ) {
    return null;
  }

  const isWinner = payload.winner;

  return (
    <g>
      {isWinner && (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="rgba(234, 179, 8, 0.12)"
          stroke="rgba(234, 179, 8, 0.55)"
          strokeWidth={1.5}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        fill="var(--primary)"
        stroke="var(--background)"
        strokeWidth={2}
      />
    </g>
  );
};

export default function UserRankingTrendChart({ ranking }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<"small" | "medium" | "large">(
    "medium",
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);

      if (width < 1024) {
        setScreenSize("small");
      } else if (width < 1280) {
        setScreenSize("medium");
      } else {
        setScreenSize("large");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chartData = useMemo<RankingChartPoint[]>(() => {
    const sortedMovieRounds = [...ranking.movie_round_rankings].sort((a, b) =>
      sortRounds(a.round, b.round),
    );

    const compactAxis = isMobile || sortedMovieRounds.length > 8;
    const showMovieNames =
      screenSize === "large" && sortedMovieRounds.length <= 8;

    return sortedMovieRounds.map((mrr, index) => ({
      index: index + 1,
      round: mrr.round,
      roundIndexLabel: `R${index + 1}`,
      xLabel: showMovieNames
        ? mrr.movie.length > 18
          ? `${mrr.movie.slice(0, 18)}…`
          : mrr.movie
        : compactAxis
          ? `R${index + 1}`
          : mrr.movie.length > 18
            ? `${mrr.movie.slice(0, 18)}…`
            : mrr.movie,
      rating: mrr.average_rating ?? null,
      movie: mrr.movie,
      winner: Boolean(mrr.round_winner),
    }));
  }, [ranking.movie_round_rankings, isMobile, screenSize]);

  const validChartData = useMemo(
    () =>
      chartData.filter(
        (point): point is RankingChartPoint & { rating: number } =>
          point.rating !== null,
      ),
    [chartData],
  );

  const compactAxis = isMobile || chartData.length > 8;
  const gradientId = `ratingGradient-${ranking.id}`;

  const averageLine =
    validChartData.length > 0
      ? validChartData.reduce((sum, point) => sum + point.rating, 0) /
        validChartData.length
      : null;

  const bestRatedPoint =
    validChartData.length > 0
      ? [...validChartData].sort((a, b) => b.rating - a.rating)[0]
      : null;

  const latestPoint =
    validChartData.length > 0
      ? validChartData[validChartData.length - 1]
      : null;

  if (ranking.movie_round_rankings.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-bold text-primary text-sm uppercase tracking-wide flex items-center gap-2">
            <LineChartIcon className="w-4 h-4" />
            Andamento Voti
          </h3>
        </div>

        <EmptyState
          title="Nessun film votato"
          subtitle="Questo utente non ha ancora votato alcun film"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-bold text-primary text-sm uppercase tracking-wide flex items-center gap-2">
          <LineChartIcon className="w-4 h-4" />
          Andamento Voti
        </h3>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--primary)" }}
          />
          Voto medio per film
        </div>
      </div>

      <div
        className="rounded-2xl border border-border p-3 sm:p-4"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--card) 96%, transparent) 0%, color-mix(in srgb, var(--secondary) 72%, transparent) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="rounded-xl border border-border bg-card/70 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Media utente
            </div>
            <div className="text-lg font-black text-primary tabular-nums">
              {averageLine !== null ? averageLine.toFixed(2) : "N/A"}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/70 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Picco migliore
            </div>
            <div className="text-sm font-bold text-foreground tabular-nums">
              {bestRatedPoint ? bestRatedPoint.rating.toFixed(2) : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-1">
              {bestRatedPoint?.movie ?? "—"}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/70 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Ultimo voto
            </div>
            <div className="text-sm font-bold text-foreground tabular-nums">
              {latestPoint ? latestPoint.rating.toFixed(2) : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-1">
              {latestPoint?.round ?? "—"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
              />
              Voto
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full border border-yellow-500/70 bg-yellow-500/15" />
              Round vinto
            </div>
          </div>
        </div>

        <div className="w-full h-[260px] sm:h-[320px] lg:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 14,
                right: isMobile ? 8 : 18,
                left: isMobile ? -22 : -10,
                bottom: compactAxis ? 10 : 58,
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={0.48}
                  />
                  <stop
                    offset="65%"
                    stopColor="var(--primary)"
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
                opacity={0.45}
              />

              <XAxis
                dataKey="xLabel"
                tickLine={false}
                axisLine={false}
                interval={0}
                minTickGap={12}
                height={compactAxis ? 24 : 58}
                angle={compactAxis ? 0 : -35}
                textAnchor={compactAxis ? "middle" : "end"}
                tick={
                  screenSize === "small"
                    ? false
                    : {
                        fill: "var(--muted-foreground)",
                        fontSize: isMobile ? 10 : 11,
                      }
                }
                hide={screenSize === "small"}
              />

              <YAxis
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                width={isMobile ? 28 : 36}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: isMobile ? 10 : 11,
                }}
              />

              {averageLine !== null && (
                <ReferenceLine
                  y={averageLine}
                  stroke="var(--primary)"
                  strokeDasharray="5 5"
                  strokeOpacity={0.35}
                />
              )}

              <Tooltip
                cursor={{
                  stroke: "var(--primary)",
                  strokeOpacity: 0.28,
                  strokeWidth: 1,
                }}
                content={<RankingChartTooltip />}
              />

              <Area
                type="monotone"
                dataKey="rating"
                connectNulls={false}
                stroke="var(--primary)"
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                dot={isMobile ? false : <RankingChartDot />}
                activeDot={{
                  r: 6,
                  fill: "var(--primary)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
