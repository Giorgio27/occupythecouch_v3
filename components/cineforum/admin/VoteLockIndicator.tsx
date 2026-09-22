import { useTranslation } from "react-i18next";
import { Lock, Hourglass, CheckCircle2 } from "lucide-react";
import VoteLockPairwiseTable from "@/components/cineforum/admin/VoteLockPairwiseTable";
import type { VoteLockResult } from "@/lib/shared/ranking/voteLock";

type Props = {
  lock: VoteLockResult;
  /** Movies in the proposal, used to label the head-to-head breakdown. */
  movies: { id: string; title: string }[];
};

/**
 * Tells the admin whether the current votes have already decided the winner,
 * given how many enabled members still have to vote. See computeVoteLock for
 * the (sound) clinch condition.
 */
export default function VoteLockIndicator({ lock, movies }: Props) {
  const { t } = useTranslation("admin");

  const { locked, remaining, winnerId, minMargin, pairwise } = lock;

  const titles = Object.fromEntries(movies.map((m) => [m.id, m.title]));
  const winnerTitle = winnerId ? (titles[winnerId] ?? null) : null;
  const breakdown = (
    <VoteLockPairwiseTable
      pairwise={pairwise}
      titles={titles}
      remaining={remaining}
    />
  );

  // Everyone enabled has voted: the result is final.
  if (remaining === 0) {
    return (
      <Banner
        tone="locked"
        icon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
        title={t("proposals.lock.finalTitle")}
        detail={t("proposals.lock.finalDetail")}
      >
        {breakdown}
      </Banner>
    );
  }

  if (locked && winnerId) {
    return (
      <Banner
        tone="locked"
        icon={<Lock className="h-4 w-4 shrink-0" />}
        title={t("proposals.lock.lockedTitle", {
          movie: winnerTitle ?? t("proposals.lock.theLeader"),
        })}
        detail={t("proposals.lock.lockedDetail", {
          count: remaining,
          margin: minMargin,
        })}
      >
        {breakdown}
      </Banner>
    );
  }

  return (
    <Banner
      tone="open"
      icon={<Hourglass className="h-4 w-4 shrink-0" />}
      title={t("proposals.lock.openTitle")}
      detail={t("proposals.lock.openDetail", { count: remaining })}
    >
      {breakdown}
    </Banner>
  );
}

function Banner({
  tone,
  icon,
  title,
  detail,
  children,
}: {
  tone: "locked" | "open";
  icon: React.ReactNode;
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  const toneClasses =
    tone === "locked"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${toneClasses}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-90">{detail}</p>
        {children}
      </div>
    </div>
  );
}
