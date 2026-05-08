import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { RatingDistributionDTO } from "@/lib/shared/types";

type DistributionTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: RatingDistributionDTO;
  }>;
};

const DistributionTooltip = ({ active, payload }: DistributionTooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div
      className="rounded-xl p-3"
      style={{
        backgroundColor: "var(--popover)",
        border: "1px solid var(--border)",
        color: "var(--popover-foreground)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="text-xs text-muted-foreground mb-1">Voto</div>
      <div className="text-lg font-bold text-primary mb-2">
        {data.rating.toFixed(1)}
      </div>
      <div className="text-sm text-foreground">
        <span className="font-semibold">{data.count}</span>{" "}
        {data.count === 1
          ? "film votato con questo voto"
          : "film votati con questo voto"}
      </div>
    </div>
  );
};

type Props = {
  data: RatingDistributionDTO[];
};

export default function RatingDistributionChart({ data }: Props) {
  return (
    <div className="cine-card p-6 mb-8">
      <h3 className="font-bold text-primary mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Distribuzione Voti
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Quanti film hai votato con ciascun voto
      </p>

      <div className="h-75 sm:h-87.5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="rating"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <RechartsTooltip
              content={<DistributionTooltip />}
              cursor={{ fill: "var(--secondary)" }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="var(--primary)"
                  opacity={0.7 + (entry.rating / 5) * 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
