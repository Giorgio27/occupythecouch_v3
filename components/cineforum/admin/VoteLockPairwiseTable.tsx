import { useTranslation } from "react-i18next";
import type { PairwiseMargin } from "@/lib/shared/ranking/pairwise";

type Props = {
  pairwise: PairwiseMargin[];
  /** Movie id -> title, to label each head-to-head. */
  titles: Record<string, string>;
  /** Ballots still to come: any margin within reach can still be overturned. */
  remaining: number;
};

/**
 * Head-to-head breakdown shown under the vote-lock banner: it makes explicit
 * *why* the winner is (or is not yet) safe, by listing every pairwise
 * confrontation and flagging the ones the remaining ballots could overturn.
 */
export default function VoteLockPairwiseTable({
  pairwise,
  titles,
  remaining,
}: Props) {
  const { t } = useTranslation("admin");

  if (pairwise.length === 0) return null;

  const hint =
    remaining > 0
      ? t("proposals.lock.pairwiseHint", { count: remaining })
      : t("proposals.lock.pairwiseHintFinal");

  return (
    <div className="mt-3 border-t border-current/15 pt-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
        {t("proposals.lock.pairwiseTitle")}
      </p>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{hint}</p>

      <div className="mt-2 grid w-fit max-w-full grid-cols-[minmax(0,max-content)_auto_minmax(0,max-content)_auto] items-center gap-x-3 gap-y-1.5 text-xs">
        {pairwise.map((row) => (
          <PairwiseRow
            key={`${row.winnerId}-${row.loserId}`}
            row={row}
            titles={titles}
            atRisk={remaining > 0 && row.margin <= remaining}
          />
        ))}
      </div>
    </div>
  );
}

function PairwiseRow({
  row,
  titles,
  atRisk,
}: {
  row: PairwiseMargin;
  titles: Record<string, string>;
  atRisk: boolean;
}) {
  const { t } = useTranslation("admin");

  return (
    <>
      <span className="truncate font-semibold">
        {titles[row.winnerId] ?? row.winnerId}
      </span>
      <span className="shrink-0 tabular-nums opacity-70">
        <span className="font-semibold opacity-100">{row.winnerVotes}</span>
        {"–"}
        {row.loserVotes}
      </span>
      <span className="truncate opacity-70">
        {titles[row.loserId] ?? row.loserId}
      </span>
      <span
        className={
          atRisk
            ? "shrink-0 rounded-full bg-current/15 px-2 py-0.5 font-semibold tabular-nums"
            : "shrink-0 tabular-nums opacity-60"
        }
      >
        {atRisk
          ? t("proposals.lock.pairwiseAtRisk", { count: row.margin })
          : t("proposals.lock.pairwiseMargin", { count: row.margin })}
      </span>
    </>
  );
}
