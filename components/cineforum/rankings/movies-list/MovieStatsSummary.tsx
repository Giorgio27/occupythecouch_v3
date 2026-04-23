import { useTranslation } from "react-i18next";
import type { MovieStatsDTO } from "@/lib/shared/types";

type MovieStatsSummaryProps = {
  movies: MovieStatsDTO[];
};

export default function MovieStatsSummary({ movies }: MovieStatsSummaryProps) {
  const { t } = useTranslation("rankings");

  const totalProposals = movies.reduce((sum, m) => sum + m.proposals, 0);
  const uniqueCount = movies.length;
  const watchedCount = movies.filter((m) => m.wins > 0).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4">
      <div className="cine-card text-center p-4">
        <div className="text-2xl sm:text-3xl font-bold text-gradient tabular-nums mb-1">
          {totalProposals}
        </div>
        <div className="text-sm text-muted-foreground">
          {t("moviesList.statProposed")}
        </div>
      </div>
      <div className="cine-card text-center p-4">
        <div className="text-2xl sm:text-3xl font-bold text-gradient tabular-nums mb-1">
          {uniqueCount}
        </div>
        <div className="text-sm text-muted-foreground">
          {t("moviesList.statUnique")}
        </div>
      </div>
      <div className="cine-card text-center p-4">
        <div className="text-2xl sm:text-3xl font-bold text-gradient tabular-nums mb-1">
          {watchedCount}
        </div>
        <div className="text-sm text-muted-foreground">
          {t("moviesList.statWatched")}
        </div>
      </div>
    </div>
  );
}
