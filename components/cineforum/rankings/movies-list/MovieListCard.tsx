import {
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
import { ExpandableListItem } from "@/components/cineforum/common";

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

  const statusBadge = isWatched ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 sm:px-2.5">
      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden sm:inline">{t("moviesList.badgeWatched")}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground sm:px-2.5">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden sm:inline">{t("moviesList.badgeUnwatched")}</span>
    </span>
  );

  return (
    <ExpandableListItem
      position={index + 1}
      title={movie.title}
      badges={statusBadge}
      metric={String(movie.proposals)}
      metricClassName="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent"
      isExpanded={isExpanded}
      onToggle={onToggle}
      animationDelay={index * 30}
    >
      {/* Expanded panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        {/* Poster — centered on mobile, left on sm+ */}
        <div className="flex shrink-0 justify-center sm:block">
          <MoviePoster
            imageMedium={movie.imageMedium}
            poster={movie.poster}
            image={movie.image}
            imdbId={movie.imdbId}
            alt={movie.title}
            className="w-24 rounded-xl border border-border object-cover shadow-md sm:w-32"
            placeholderClassName="w-24 rounded-xl border border-border bg-muted flex items-center justify-center aspect-[2/3] sm:w-32"
          />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {movie.year && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-foreground">
                  {movie.year}
                </span>
              </span>
            )}
            {movie.director && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-foreground">
                  {movie.director}
                </span>
              </span>
            )}
            {isWatched && movie.round_name && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 shrink-0 text-yellow-500" />
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
            <div className="flex flex-wrap items-start gap-2">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Overview */}
          {movie.overview && (
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground sm:line-clamp-3">
              {movie.overview}
            </p>
          )}

          {/* IMDB link */}
          {movie.imdbId && (
            <a
              href={`https://www.imdb.com/title/${movie.imdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-sm font-medium text-yellow-600 transition-colors hover:bg-yellow-500/20 dark:text-yellow-400"
            >
              <Film className="h-4 w-4" />
              {t("moviesList.detailImdb")}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </ExpandableListItem>
  );
}
