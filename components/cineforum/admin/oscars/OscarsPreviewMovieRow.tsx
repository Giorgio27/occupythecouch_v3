import { useState } from "react";
import { ChevronDown, ChevronUp, Crown, Sofa } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MovieWinnerDTO } from "@/lib/shared/types/cineforum";
import MoviePoster from "@/components/ui/MoviePoster";
import UserVotes from "@/components/cineforum/oscars/UserVotes";

interface OscarsPreviewMovieRowProps {
  movie: MovieWinnerDTO;
  /** True when this movie currently holds the highest partial average. */
  isLeading: boolean;
}

/**
 * Read-only movie row for the admin oscars preview.
 *
 * Mirrors the closed-round oscars layout — poster, title, current partial
 * average — and expands to show only the per-user votes (no external ratings).
 * Movies currently in the lead are highlighted with a provisional badge.
 */
export default function OscarsPreviewMovieRow({
  movie,
  isLeading,
}: OscarsPreviewMovieRowProps) {
  const { t } = useTranslation("admin");
  const [isExpanded, setIsExpanded] = useState(false);

  const hasVotes = movie.roundVotes.length > 0;

  return (
    <div
      className={`oscars-movie-card cursor-pointer${isLeading ? " oscars-movie-card--winner" : ""}`}
      onClick={() => setIsExpanded((prev) => !prev)}
    >
      <div className="flex items-center gap-2.5">
        <div className="oscars-movie-card__poster overflow-hidden">
          <MoviePoster
            imageMedium={movie.imageMedium}
            poster={movie.poster}
            image={movie.image}
            imdbId={movie.id}
            alt={movie.title}
            className="w-full h-full object-cover"
            placeholderClassName="w-full h-full flex items-center justify-center bg-muted"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight truncate">
            {movie.title}
            {movie.year && (
              <span className="text-muted-foreground font-normal ml-1">
                ({movie.year})
              </span>
            )}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
            <p className="text-[10px] text-muted-foreground truncate min-w-0">
              {movie.proposer}
            </p>
            {isLeading && (
              <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0 text-[9px] font-medium text-yellow-600 dark:text-yellow-500">
                <Crown className="h-2.5 w-2.5" />
                {t("oscars.leadingBadge")}
              </span>
            )}
          </div>
        </div>

        <div
          className="shrink-0 flex flex-col items-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 text-xs font-semibold">
            <Sofa className="h-3 w-3 text-primary" />
            <span>
              {movie.roundRating !== null ? movie.roundRating.toFixed(2) : "—"}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isExpanded ? (
              <span className="flex items-center gap-0.5">
                meno <ChevronUp className="h-3 w-3" />
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                dettagli <ChevronDown className="h-3 w-3" />
              </span>
            )}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div
          className="mt-2 pt-2 border-t border-border/50 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {hasVotes ? (
            <UserVotes votes={movie.roundVotes} />
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Nessun voto ancora.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
