import { Trophy, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProposalRankingMovieDTO } from "@/lib/shared/types/cineforum";
import { useTranslation } from "react-i18next";
import MoviePoster from "@/components/ui/MoviePoster";

export type ProposalMovieCardMovie = {
  id: string;
  /** From ProposalMovieDTO */
  title?: string | null;
  year?: number | null;
  image?: string | null;
  imageMedium?: string | null;
  /** From ImdbMovieData (raw search results) */
  l?: string;
  y?: number;
  i?: string[];
};

type ProposalMovieCardProps = {
  movie: ProposalMovieCardMovie;
  /**
   * Whether this movie is the official winner (from proposal.winner.id === movie.id).
   * When true, shows the winner label and trophy icon.
   */
  isWinner?: boolean;
  /**
   * Whether this movie is currently leading in an open proposal (rank === 1, no official winner yet).
   * Shows a distinct "leading" label and icon instead of the winner trophy.
   */
  isLeading?: boolean;
  /** Ranking data for this movie, if already loaded (used only for rank badge) */
  rankedMovie?: ProposalRankingMovieDTO | null;
  /** Namespace for translations: "admin" or "rankings" */
  tNamespace?: string;
  /** Show delete button (admin edit mode) */
  onRemove?: (id: string) => void;
};

export default function ProposalMovieCard({
  movie,
  isWinner = false,
  isLeading = false,
  rankedMovie,
  tNamespace = "rankings",
  onRemove,
}: ProposalMovieCardProps) {
  const { t } = useTranslation(tNamespace);

  const movieTitle = movie.title ?? movie.l ?? "";
  const movieYear = movie.year ?? movie.y;

  const highlighted = isWinner || isLeading;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        isWinner
          ? "border-primary/40 bg-primary/8"
          : isLeading
            ? "border-amber-400/40 bg-amber-50/10"
            : "border-border/60 bg-card/60"
      }`}
    >
      {/* Poster */}
      <MoviePoster
        imageMedium={movie.imageMedium ?? movie.i?.[1] ?? null}
        image={movie.i?.[0] ?? null}
        imdbId={movie.id ?? null}
        alt={movieTitle}
        className="h-24 w-16 shrink-0 rounded-lg object-cover shadow-sm"
        placeholderClassName="h-24 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center"
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {isWinner && (
              <p className="mb-1 text-xs font-semibold text-primary">
                {t("proposals.winner")}
              </p>
            )}
            {isLeading && !isWinner && (
              <p className="mb-1 text-xs font-semibold text-amber-500">
                {t("proposals.leading")}
              </p>
            )}
            <p
              className="truncate font-semibold text-foreground"
              title={movieTitle}
            >
              {movieTitle}
            </p>
            {movieYear && (
              <p className="text-sm text-muted-foreground">{movieYear}</p>
            )}
          </div>

          {/* Trophy icon for official winner */}
          {isWinner && (
            <Trophy className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          )}

          {/* Trending icon for leading movie in open proposal */}
          {isLeading && !isWinner && (
            <TrendingUp className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          )}

          {/* Delete button (admin edit mode) */}
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(movie.id)}
              className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 -mr-1"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Rank badge (from Schulze ranking, loaded lazily) */}
        {rankedMovie && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs">
            <span className="font-semibold">{t("proposals.ranksLabel")}</span>
            <span className="text-primary font-bold tabular-nums">
              {rankedMovie.proposal_rank}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
