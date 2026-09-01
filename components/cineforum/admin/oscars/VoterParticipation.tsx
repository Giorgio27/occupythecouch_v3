import { Check, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { VoterParticipationDTO } from "@/lib/shared/types/cineforum";

interface VoterParticipationProps {
  voters: VoterParticipationDTO[];
  totalMovies: number;
}

/**
 * Shows, for every active member, how many of the round's movies they've
 * voted on so far — so admins can spot at a glance who still needs to vote.
 */
export default function VoterParticipation({
  voters,
  totalMovies,
}: VoterParticipationProps) {
  const { t } = useTranslation("admin");

  if (voters.length === 0 || totalMovies === 0) return null;

  return (
    <div className="mt-2 border-t border-border/40 pt-2">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Users className="h-3 w-3" />
        {t("oscars.voterParticipation")}
      </p>
      <div className="space-y-1">
        {voters.map((voter) => {
          const complete = voter.votedCount >= totalMovies;
          const colorClass = complete
            ? "text-emerald-600 dark:text-emerald-500"
            : voter.votedCount === 0
              ? "text-muted-foreground"
              : "text-amber-600 dark:text-amber-500";

          return (
            <div
              key={voter.userId}
              className="flex items-center justify-between rounded-lg bg-secondary/40 px-2.5 py-1"
            >
              <span className="truncate text-xs text-foreground">
                {voter.name}
              </span>
              <span
                className={`flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums ${colorClass}`}
              >
                {complete && <Check className="h-3 w-3" />}
                {voter.votedCount}/{totalMovies}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
