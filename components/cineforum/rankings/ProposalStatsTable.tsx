import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { ProposalUserStatDTO } from "@/lib/shared/types";

type SortKey =
  | "user_name"
  | "proposals_created"
  | "proposals_voted"
  | "proposals_missed"
  | "avg_vote_delay_hours";
type SpeedTier = "fast" | "medium" | "slow";

const TIER_STYLES: Record<SpeedTier, { badge: string; emoji: string; label: string }> = {
  fast:   { badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20", emoji: "🚀", label: "veloce" },
  medium: { badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",         emoji: "⏳", label: "medio"  },
  slow:   { badge: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",                 emoji: "🐌", label: "lento"  },
};

function formatDelay(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}gg`;
}

type Props = { data: ProposalUserStatDTO[] };

export default function ProposalStatsTable({ data }: Props) {
  const { t } = useTranslation("rankings");
  const [sortKey, setSortKey] = useState<SortKey>("proposals_created");
  const [sortAsc, setSortAsc] = useState(false);

  // Compute speed tiers relative to all users who have a delay
  const speedTierMap = useMemo(() => {
    const withDelay = data
      .filter((u) => u.avg_vote_delay_hours !== null)
      .sort((a, b) => a.avg_vote_delay_hours! - b.avg_vote_delay_hours!);
    const n = withDelay.length;
    const map = new Map<string, SpeedTier>();
    withDelay.forEach((u, i) => {
      const pct = n === 1 ? 0.5 : i / (n - 1);
      map.set(u.user_id, pct < 0.34 ? "fast" : pct < 0.67 ? "medium" : "slow");
    });
    return map;
  }, [data]);

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    if (typeof av === "string" && typeof bv === "string")
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const Th = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggle(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === col
          ? sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">#</th>
            <Th col="user_name"             label={t("proposalStats.colUser")}    />
            <Th col="proposals_created"     label={t("proposalStats.colCreated")} />
            <Th col="proposals_voted"       label={t("proposalStats.colVoted")}   />
            <Th col="proposals_missed"      label={t("proposalStats.colMissed")}  />
            <Th col="avg_vote_delay_hours"  label={t("proposalStats.colDelay")}   />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((row, i) => {
            const tier = speedTierMap.get(row.user_id) ?? null;
            const tierStyle = tier ? TIER_STYLES[tier] : null;
            return (
              <tr key={row.user_id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{row.user_name}</td>
                <td className="px-4 py-3 tabular-nums text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 min-w-7">
                      {row.proposals_created}
                    </span>
                    {row.proposals_created_team > 0 && (
                      <span className="text-[10px] leading-none text-muted-foreground whitespace-nowrap">
                        {t("proposalStats.createdBreakdown", {
                          solo: row.proposals_created_solo,
                          team: row.proposals_created_team,
                        })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 min-w-7">
                    {row.proposals_voted}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-2.5 py-0.5 min-w-7 ${
                      row.proposals_missed > 0
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {row.proposals_missed}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.avg_vote_delay_hours === null || !tierStyle ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${tierStyle.badge}`}>
                      <span>{tierStyle.emoji}</span>
                      <span>{formatDelay(row.avg_vote_delay_hours)}</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
