import { useTranslation } from "react-i18next";
import { Lock, Hourglass, CheckCircle2 } from "lucide-react";
import type { VoteLockResult } from "@/lib/shared/ranking/voteLock";

type Props = {
  lock: VoteLockResult;
  /** Title of the guaranteed winner, when the lock resolves to one. */
  winnerTitle?: string | null;
};

/**
 * Tells the admin whether the current votes have already decided the winner,
 * given how many enabled members still have to vote. See computeVoteLock for
 * the (sound) clinch condition.
 */
export default function VoteLockIndicator({ lock, winnerTitle }: Props) {
  const { t } = useTranslation("admin");

  const { locked, remaining, winnerId, minMargin } = lock;

  // Everyone enabled has voted: the result is final.
  if (remaining === 0) {
    return (
      <Banner
        tone="locked"
        icon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
        title={t("proposals.lock.finalTitle")}
        detail={t("proposals.lock.finalDetail")}
      />
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
      />
    );
  }

  return (
    <Banner
      tone="open"
      icon={<Hourglass className="h-4 w-4 shrink-0" />}
      title={t("proposals.lock.openTitle")}
      detail={t("proposals.lock.openDetail", { count: remaining })}
    />
  );
}

function Banner({
  tone,
  icon,
  title,
  detail,
}: {
  tone: "locked" | "open";
  icon: React.ReactNode;
  title: string;
  detail: string;
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
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-90">{detail}</p>
      </div>
    </div>
  );
}
