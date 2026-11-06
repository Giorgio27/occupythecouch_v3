import {
  CalendarDays,
  CheckCircle,
  Clock,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import MovieBallots from "./MovieBallots";
import type {
  MovieAppearanceDTO,
  MovieAppearanceStatus,
} from "@/lib/shared/types";

type MovieAppearanceCardProps = {
  appearance: MovieAppearanceDTO;
};

const STATUS_STYLE: Record<MovieAppearanceStatus, string> = {
  won: "bg-green-500/10 text-green-600 dark:text-green-400",
  lost: "bg-secondary text-muted-foreground",
  open: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const STATUS_ICON: Record<MovieAppearanceStatus, typeof Trophy> = {
  won: Trophy,
  lost: XCircle,
  open: Clock,
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(i18n.language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** One proposal the movie took part in: outcome, rank and, when public, the ballots. */
export default function MovieAppearanceCard({
  appearance,
}: MovieAppearanceCardProps): JSX.Element {
  const { t } = useTranslation("movie");
  const StatusIcon = STATUS_ICON[appearance.status];
  const date = formatDate(appearance.date);
  const isClosed = appearance.status !== "open";

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {appearance.proposalTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {appearance.roundName} ·{" "}
            {t("appearances.proposedBy", { owner: appearance.owner })}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[appearance.status]}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {t(`appearances.${appearance.status}`)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {date && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {date}
          </span>
        )}
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Users className="h-3.5 w-3.5 text-primary" />
          {t("appearances.voters", { count: appearance.voterCount })}
        </span>
        {appearance.schulzeRank !== null && (
          <span className="inline-flex items-center gap-1 font-medium text-foreground tabular-nums">
            <CheckCircle className="h-3.5 w-3.5 text-primary" />
            {t("appearances.rank", {
              rank: appearance.schulzeRank,
              total: appearance.candidateCount,
            })}
          </span>
        )}
        {appearance.winnerTitle && (
          <span className="text-foreground">
            {t("appearances.lostTo", { title: appearance.winnerTitle })}
          </span>
        )}
      </div>

      {appearance.ballots && appearance.ballots.length > 0 && (
        <MovieBallots ballots={appearance.ballots} />
      )}
      {isClosed && appearance.ballots === null && appearance.voterCount > 0 && (
        <p className="mt-3 text-xs italic text-muted-foreground">
          {t("appearances.ballotsHidden")}
        </p>
      )}
    </li>
  );
}
