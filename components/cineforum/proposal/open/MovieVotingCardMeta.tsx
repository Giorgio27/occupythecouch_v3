import Image from "next/image";
import { Clock, Info, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import MovieLink from "@/components/cineforum/movies/MovieLink";
import type { ProposalMovieDTO } from "@/lib/shared/types";

type MovieVotingCardMetaProps = { movie: ProposalMovieDTO };

/**
 * Runtime, IMDb and movie-page links, and rating of a voting card. Both links
 * stop the tap from reaching the card, so it does not open the position picker.
 */
export default function MovieVotingCardMeta({
  movie,
}: MovieVotingCardMetaProps): JSX.Element {
  const { t } = useTranslation("movie");

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1.5">
      {movie.runtime && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
          <Clock className="h-3 w-3" />
          <span>{movie.runtime}</span>
        </div>
      )}
      {movie.imdbId && (
        <a
          href={`https://www.imdb.com/title/${movie.imdbId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          title="View on IMDb"
        >
          <Image
            src="/imdb-icon.webp"
            alt="IMDb"
            width={16}
            height={16}
            className="rounded-sm"
          />
        </a>
      )}
      {/* New tab: the ranking is unsaved React state until submit, so
    navigating away would lose it (same reason as the IMDb link).
    The negative margin grows the tap target without moving the icon. */}
      <MovieLink
        movieId={movie.id}
        newTab
        ariaLabel={t("link.openLabel", { title: movie.title })}
        className="-m-2 flex items-center p-2 text-muted-foreground transition-colors hover:text-primary"
      >
        <Info className="h-4 w-4" />
      </MovieLink>
      {(movie.rating || movie.imdbRating) && (
        <div className="flex items-center gap-1 text-xs">
          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          <span className="text-muted-foreground font-medium">
            {movie.rating || movie.imdbRating}
          </span>
        </div>
      )}
    </div>
  );
}
