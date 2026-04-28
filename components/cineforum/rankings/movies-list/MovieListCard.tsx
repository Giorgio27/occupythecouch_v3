import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  ExternalLink,
  Film,
  Calendar,
  User,
  Tag,
  Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MovieStatsDTO } from "@/lib/shared/types";
import MoviePoster from "@/components/ui/MoviePoster";

type MovieListCardProps = {
  movie: MovieStatsDTO;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function MovieListCard({
  movie,
  index,
  isExpanded,
  onToggle,
}: MovieListCardProps) {
  const { t } = useTranslation("rankings");
  const isWatched = movie.wins > 0;

  return (
    <div
      className="cine-card-fit hover:shadow-lg transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Row — clickable */}
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-3 sm:px-6">
          {/* # — w-8 sm:w-16 */}
          <div className="w-8 sm:w-16 text-center font-bold text-base sm:text-xl text-gradient tabular-nums flex-shrink-0">
            {index + 1}
          </div>

          {/* Title — flex-1 */}
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm sm:text-base text-foreground block truncate">
              {movie.title}
            </span>
          </div>

          {/* Status — w-8 sm:w-28, icon only on mobile */}
          <div className="w-8 sm:w-28 flex justify-center flex-shrink-0">
            {isWatched ? (
              <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {t("moviesList.badgeWatched")}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {t("moviesList.badgeUnwatched")}
                </span>
              </span>
            )}
          </div>

          {/* Proposals — w-8 sm:w-20 */}
          <div className="w-8 sm:w-20 text-right flex-shrink-0">
            <span className="font-bold text-sm sm:text-base text-gradient tabular-nums">
              {movie.proposals}
            </span>
          </div>

          {/* Chevron — w-6 sm:w-10 */}
          <div className="w-6 sm:w-10 flex justify-center flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-border px-4 sm:px-6 py-4 sm:py-6 bg-secondary/30">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
            {/* Poster — centered on mobile, left on sm+ */}
            <div className="flex-shrink-0 flex justify-center sm:block">
              <MoviePoster
                imageMedium={movie.imageMedium}
                poster={movie.poster}
                image={movie.image}
                imdbId={movie.imdbId}
                alt={movie.title}
                className="w-24 sm:w-32 rounded-xl object-cover shadow-md border border-border"
                placeholderClassName="w-24 sm:w-32 rounded-xl border border-border bg-muted flex items-center justify-center aspect-[2/3]"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              {/* Meta row */}
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {movie.year && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {movie.year}
                    </span>
                  </span>
                )}
                {movie.director && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <User className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {movie.director}
                    </span>
                  </span>
                )}
                {isWatched && movie.round_name && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span>
                      {t("moviesList.detailRound")}:{" "}
                      <span className="font-medium text-foreground">
                        {movie.round_name}
                      </span>
                    </span>
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genres.length > 0 && (
                <div className="flex items-start gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview */}
              {movie.overview && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 sm:line-clamp-3">
                  {movie.overview}
                </p>
              )}

              {/* IMDB link */}
              {movie.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${movie.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors"
                >
                  <Film className="w-4 h-4" />
                  {t("moviesList.detailImdb")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
