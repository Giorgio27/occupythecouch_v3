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
      className={`cine-card hover-lift p-3 sm:p-4 text-left flex items-center gap-3 transition-all duration-300 ${
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
          className="h-20 w-14 sm:h-24 sm:w-16 rounded-md object-cover border border-border/60 shadow-sm flex-shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="truncate text-sm sm:text-base font-semibold text-foreground">
          {movie.l} {movie.y ? `(${movie.y})` : ""}
        </div>
        <div className="truncate text-xs text-muted-foreground mt-0.5">
          {movie.s}
        </div>
      </div>

      <div className="ml-auto flex-shrink-0">
        {variant === "selected" ? (
          <div className="cine-badge bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
            <X className="mr-1.5 h-3.5 w-3.5" />
            {t("create.remove")}
          </div>
        ) : isSelected ? (
          <div className="cine-badge bg-primary text-primary-foreground">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            {t("create.selected")}
          </div>
        ) : (
          <div className="cine-badge opacity-70">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("create.add")}
          </div>
        )}
      </div>
    </button>
  );
}
