import { useTranslation } from "react-i18next";
import type { DirectorRankingDTO } from "@/lib/shared/types";

type DirectorMoviesTableProps = {
  movies: DirectorRankingDTO["movies"];
};

export default function DirectorMoviesTable({
  movies,
}: DirectorMoviesTableProps) {
  const { t } = useTranslation("rankings");

  const sorted = [...movies].sort(
    (a, b) => b.average_rating - a.average_rating,
  );

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border">
        <div className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="flex-1">{t("directors.moviesTitleCol")}</div>
          <div className="w-20 sm:w-24 text-right">
            {t("directors.moviesRatingCol")}
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((movie, idx) => (
          <div
            key={idx}
            className="flex items-center px-4 py-3 sm:py-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex-1">
              <span className="text-sm sm:text-base text-foreground font-medium">
                {movie.title}
              </span>
            </div>
            <div className="w-20 sm:w-24 text-right">
              <span className="font-bold text-sm sm:text-base text-gradient tabular-nums">
                {movie.average_rating.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
