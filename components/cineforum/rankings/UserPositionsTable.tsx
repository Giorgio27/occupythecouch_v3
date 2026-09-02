import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MoveHorizontal } from "lucide-react";
import SortableTh, { STICKY_CLASSES } from "@/components/cineforum/rankings/SortableTh";
import type { UserPositionDTO } from "@/lib/shared/types";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/** "🥇" / "🥈" / "🥉" for the podium, "4°" / "5°" / ... for the rest. */
function positionLabel(position: number): string {
  return MEDALS[position] ?? `${position}°`;
}

type SortKey = "user_name" | "points" | "weighted_score" | number;

type Props = { data: UserPositionDTO[] };

/** F1-style points leaderboard: one sortable column per position, plus total and weighted points. */
export default function UserPositionsTable({ data }: Props) {
  const { t } = useTranslation("rankings");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortAsc, setSortAsc] = useState(false);

  const positionColumns = useMemo(() => {
    const max = data.reduce(
      (acc, row) => Math.max(acc, ...Object.keys(row.positions).map(Number)),
      0,
    );
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [data]);

  const getValue = (row: UserPositionDTO, key: SortKey): number | string => {
    if (key === "user_name") return row.user_name;
    if (key === "points") return row.points;
    if (key === "weighted_score") return row.weighted_score;
    return row.positions[key] ?? 0;
  };

  const sorted = [...data].sort((a, b) => {
    const av = getValue(a, sortKey);
    const bv = getValue(b, sortKey);
    if (typeof av === "string" && typeof bv === "string")
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === "user_name");
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Mobile-only hint that the table scrolls horizontally */}
      <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
        <MoveHorizontal className="w-3.5 h-3.5 shrink-0" />
        {t("positions.scrollHint")}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>
              <SortableTh
                label={t("positions.colUser")}
                align="left"
                sticky="left"
                active={sortKey === "user_name"}
                sortAsc={sortAsc}
                onClick={() => toggle("user_name")}
              />
              {positionColumns.map((position) => (
                <SortableTh
                  key={position}
                  label={positionLabel(position)}
                  active={sortKey === position}
                  sortAsc={sortAsc}
                  onClick={() => toggle(position)}
                />
              ))}
              <SortableTh
                label={t("positions.colWeighted")}
                active={sortKey === "weighted_score"}
                sortAsc={sortAsc}
                onClick={() => toggle("weighted_score")}
              />
              <SortableTh
                label={t("positions.colPoints")}
                sticky="right"
                active={sortKey === "points"}
                sortAsc={sortAsc}
                onClick={() => toggle("points")}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((row) => (
              <tr key={row.user_id} className="group">
                <td
                  className={`px-2 py-2.5 sm:px-3 sm:py-3 font-semibold text-foreground whitespace-nowrap bg-card border-border transition-colors group-hover:bg-muted/30 ${STICKY_CLASSES.left}`}
                >
                  {row.user_name}
                </td>
                {positionColumns.map((position) => {
                  const count = row.positions[position] ?? 0;
                  return (
                    <td
                      key={position}
                      className="px-2 py-2.5 sm:px-3 sm:py-3 text-center tabular-nums bg-card transition-colors group-hover:bg-muted/30"
                    >
                      {count > 0 ? (
                        <span className="text-foreground font-medium">
                          {count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-2.5 sm:px-3 sm:py-3 text-center bg-card transition-colors group-hover:bg-muted/30">
                  <span className="font-bold text-gradient tabular-nums">
                    {row.weighted_score.toFixed(1)}
                  </span>
                </td>
                <td
                  className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center bg-card border-border transition-colors group-hover:bg-muted/30 ${STICKY_CLASSES.right}`}
                >
                  <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary">
                    {row.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
