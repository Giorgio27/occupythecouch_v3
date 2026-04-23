import { ChevronDown, ChevronUp, Film } from "lucide-react";
import { useTranslation } from "react-i18next";
import DirectorMoviesTable from "./DirectorMoviesTable";
import type { DirectorRankingDTO } from "@/lib/shared/types";

type DirectorCardProps = {
  director: DirectorRankingDTO;
  position: number;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function DirectorCard({
  director,
  position,
  isExpanded,
  onToggle,
}: DirectorCardProps) {
  const { t } = useTranslation("rankings");

  return (
    <div className="cine-card-fit hover:shadow-lg transition-all duration-300">
      <button onClick={onToggle} className="w-full">
        <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6">
          <div className="w-12 sm:w-16 text-center font-bold text-lg sm:text-xl text-gradient tabular-nums">
            {position}
          </div>
          <div className="flex-1 text-left">
            <span className="font-semibold text-sm sm:text-base text-foreground">
              {director.name}
            </span>
          </div>
          <div className="w-16 sm:w-20 text-center">
            <span className="font-bold text-sm sm:text-base text-muted-foreground tabular-nums">
              {director.count}
            </span>
          </div>
          <div className="w-20 sm:w-24 text-right">
            <span className="font-bold text-sm sm:text-base text-gradient tabular-nums">
              {director.average_rating.toFixed(2)}
            </span>
          </div>
          <div className="w-8 sm:w-10 flex justify-center">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 sm:px-6 py-4 sm:py-6 bg-secondary/30">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
            <Film className="w-4 h-4" />
            {t("directors.moviesSection")}
          </h3>
          <DirectorMoviesTable movies={director.movies} />
        </div>
      )}
    </div>
  );
}
