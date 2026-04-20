import * as React from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  onToggle: (movie: Movie) => void;
  variant?: "search" | "selected";
};

export default function MovieCard({
  movie,
  isSelected = false,
  onToggle,
  variant = "search",
}: MovieCardProps) {
  const { t } = useTranslation("proposal");
  console.log("images", movie.i);

  // Get higher resolution image if available
  const getImageUrl = (movie: Movie) => {
    // Try to get higher resolution image from i array
    if (movie.i && movie.i.length > 0) {
      // IMDb images often have size parameters, try to get larger version
      return movie.i[1] ?? movie.i[0] ?? null;
    }
    return null;
  };

  const imageUrl = getImageUrl(movie);

  return (
    <button
      onClick={() => onToggle(movie)}
      className={`cine-card-mobile hover-lift text-left flex items-center gap-2 sm:gap-3 transition-all duration-300 ${
        isSelected
          ? "border-primary/50 bg-primary/5"
          : "hover:border-primary/30"
      }`}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={imageUrl}
          className="h-14 w-10 sm:h-20 sm:w-14 md:h-24 md:w-16 rounded-md object-cover border border-border/60 shadow-sm shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="truncate text-xs sm:text-sm md:text-base font-semibold text-foreground">
          {movie.l} {movie.y ? `(${movie.y})` : ""}
        </div>
        <div className="truncate text-xs text-muted-foreground mt-0.5">
          {movie.s}
        </div>
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
