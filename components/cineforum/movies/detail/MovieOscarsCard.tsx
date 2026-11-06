import { Activity, Award, Crown, Medal, Sofa } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/cineforum/common";
import { CONSENSUS_MIN_VOTES } from "@/lib/shared/ranking/consensus";
import MovieOscarVotes from "./MovieOscarVotes";
import type { MovieOscarsDTO } from "@/lib/shared/types";

type MovieOscarsCardProps = { oscars: MovieOscarsDTO };

/**
 * The movie's Oscars result in one closed round: headline numbers and every
 * rating. Not wrapped in a card itself, so the StatCards are not nested
 * inside another bordered box.
 */
export default function MovieOscarsCard({
  oscars,
}: MovieOscarsCardProps): JSX.Element {
  const { t } = useTranslation("movie");
  const rankValue = (rank: number | null, total: number): string | null =>
    rank === null ? null : t("oscars.rankValue", { rank, total });

  return (
    <article>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{oscars.roundName}</p>
          <p className="text-xs text-muted-foreground">
            {t("oscars.proposedBy", { owner: oscars.owner })}
          </p>
        </div>
        {oscars.roundWinner && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
            <Crown className="h-3.5 w-3.5" />
            {t("oscars.roundWinner")}
          </span>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Sofa className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/10"
          label={t("oscars.average")}
          value={oscars.averageRating?.toFixed(2) ?? null}
          valueClassName="text-gradient"
        />
        <StatCard
          icon={<Medal className="w-5 h-5 text-amber-500" />}
          iconBg="bg-amber-500/10"
          label={t("oscars.roundPosition")}
          value={rankValue(oscars.roundPosition, oscars.roundSize)}
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-purple-500" />}
          iconBg="bg-purple-500/10"
          label={t("oscars.overallRank")}
          value={rankValue(oscars.overallRank, oscars.overallTotal)}
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-500/10"
          label={t("oscars.consensus")}
          value={oscars.stdDev?.toFixed(2) ?? null}
          tooltip={t("oscars.consensusTooltip", { min: CONSENSUS_MIN_VOTES })}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <MovieOscarVotes votes={oscars.votes} />
      </div>
    </article>
  );
}
