import * as React from "react";
import { CheckCircle2, Plus, X, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import MoviePoster from "@/components/ui/MoviePoster";

type Movie = {
  id: string;
  l: string; // title
  y?: string; // year
  s?: string; // subtitle/description
  i?: string[]; // images array
};

type MovieCardProps = {
  movie: Movie;
  isSelected?: boolean;
  isPreviousWinner?: boolean;
  onToggle: (movie: Movie) => void;
  variant?: "search" | "selected";
};

export default function MovieCard({
  movie,
  isSelected = false,
  isPreviousWinner = false,
  onToggle,
  variant = "search",
}: MovieCardProps) {
  const { t } = useTranslation("proposal");

  return (
    <button
      onClick={() => onToggle(movie)}
      title={isPreviousWinner ? t("create.previousWinnerTooltip") : undefined}
      className={`cine-card-mobile hover-lift text-left flex items-center gap-2 sm:gap-3 transition-all duration-300 relative ${
        isPreviousWinner
          ? "border-amber-500/40 bg-amber-500/5"
          : isSelected
            ? "border-primary/50 bg-primary/5"
            : "hover:border-primary/30"
      }`}
    >
      {/* Previous winner ribbon */}
      {isPreviousWinner && (
        <div className="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none">
          <div className="absolute top-2 -right-4 w-16 rotate-45 bg-amber-500 text-[9px] font-bold text-white text-center py-0.5 shadow-sm">
            <Eye className="inline h-2.5 w-2.5 -mt-0.5" />
          </div>
        </div>
      )}

      <MoviePoster
        imageMedium={movie.i?.[1] ?? null}
        image={movie.i?.[0] ?? null}
        imdbId={movie.id}
        alt=""
        className={`h-14 w-10 sm:h-20 sm:w-14 md:h-24 md:w-16 rounded-md object-cover border shadow-sm shrink-0 ${
          isPreviousWinner ? "border-amber-500/40" : "border-border/60"
        }`}
        placeholderClassName={`h-14 w-10 sm:h-20 sm:w-14 md:h-24 md:w-16 rounded-md border shadow-sm shrink-0 bg-muted flex items-center justify-center ${
          isPreviousWinner ? "border-amber-500/40" : "border-border/60"
        }`}
      />

      <div className="flex-1 min-w-0">
        <div className="truncate text-xs sm:text-sm md:text-base font-semibold text-foreground">
          {movie.l} {movie.y ? `(${movie.y})` : ""}
        </div>
        <div className="truncate text-xs text-muted-foreground mt-0.5">
          {movie.s}
        </div>

        {/* Previous winner inline badge */}
        {isPreviousWinner && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5">
            <Eye className="h-2.5 w-2.5 text-amber-500 shrink-0" />
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 leading-none">
              {t("create.previousWinner")}
            </span>
          </div>
        )}
      </div>

      <div className="ml-auto shrink-0 flex items-center">
        {variant === "selected" ? (
          <div className="cine-badge bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1.5 mr-1 sm:mr-2">
            <X className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3 md:mr-1.5 md:h-3.5 md:w-3.5" />
            <span className="hidden lg:inline">{t("create.remove")}</span>
          </div>
        ) : isSelected ? (
          <div className="cine-badge bg-primary text-primary-foreground px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1.5 mr-1 sm:mr-2">
            <CheckCircle2 className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3 md:mr-1.5 md:h-3.5 md:w-3.5" />
            <span className="hidden lg:inline">{t("create.selected")}</span>
          </div>
        ) : (
          <div className="cine-badge opacity-70 px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1.5 mr-1 sm:mr-2">
            <Plus className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3 md:mr-1.5 md:h-3.5 md:w-3.5" />
            <span className="hidden lg:inline">{t("create.add")}</span>
          </div>
        )}
      </div>
    </button>
  );
}
