import type { ReactNode } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { SectionHeader } from "@/components/cineforum/common";

/** One axis: plotted values plus the human-readable value for the tooltip. */
export type RadarRow = {
  axis: string;
  a: number;
  aLabel: string;
  b: number;
  bLabel: string;
};

export type RadarSeries = { name: string; isClub: boolean };

type RadarHexagonProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  rows: RadarRow[];
  maxValue: number;
  seriesA: string;
  seriesB: RadarSeries;
  children?: ReactNode;
};

type RadarTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: RadarRow }>;
  seriesA: string;
  seriesB: string;
};

const COLOR_A = "var(--primary)";
const COLOR_B = "var(--color-amber-500)";
const COLOR_CLUB = "var(--muted-foreground)";
// Side room so long axis labels ("Sud del mondo") aren't clipped on phones.
const CHART_MARGIN = { top: 8, right: 36, bottom: 8, left: 36 };

function RadarTooltip({ active, payload, seriesA, seriesB }: RadarTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div
      className="rounded-xl p-3 text-sm"
      style={{
        backgroundColor: "var(--popover)",
        border: "1px solid var(--border)",
        color: "var(--popover-foreground)",
      }}
    >
      <p className="font-bold mb-1">{row.axis}</p>
      <p className="tabular-nums">
        <span className="text-primary font-semibold">{seriesA}</span>: {row.aLabel}
      </p>
      <p className="tabular-nums text-muted-foreground">
        {seriesB}: {row.bLabel}
      </p>
    </div>
  );
}

/** A PES-style hexagon overlaying the selected member (A) and a comparison (B). */
export default function RadarHexagon({
  title,
  subtitle,
  icon,
  rows,
  maxValue,
  seriesA,
  seriesB,
  children,
}: RadarHexagonProps) {
  const colorB = seriesB.isClub ? COLOR_CLUB : COLOR_B;

  return (
    <div className="min-w-0 flex flex-col rounded-xl border border-border bg-secondary/30 p-4">
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
      />
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={rows}
            outerRadius="62%"
            margin={CHART_MARGIN}
          >
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <PolarRadiusAxis
              type="number"
              domain={[0, maxValue]}
              allowDataOverflow
              tick={false}
              axisLine={false}
            />
            <Radar
              dataKey="b"
              stroke={colorB}
              fill={colorB}
              fillOpacity={seriesB.isClub ? 0.08 : 0.2}
              strokeDasharray={seriesB.isClub ? "4 4" : undefined}
            />
            <Radar
              dataKey="a"
              stroke={COLOR_A}
              fill={COLOR_A}
              fillOpacity={0.35}
            />
            <RechartsTooltip
              content={<RadarTooltip seriesA={seriesA} seriesB={seriesB.name} />}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {children}
    </div>
  );
}
