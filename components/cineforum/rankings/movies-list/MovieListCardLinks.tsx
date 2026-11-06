import { ArrowRight, ExternalLink, Film } from "lucide-react";
import { useTranslation } from "react-i18next";
import MovieLink from "@/components/cineforum/movies/MovieLink";

type MovieListCardLinksProps = {
  movieId: string;
  title: string;
  imdbId: string | null;
};

const linkClass =
  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors";

/** Movie page link plus the external IMDb link, shown in the expanded movie card. */
export default function MovieListCardLinks({
  movieId,
  title,
  imdbId,
}: MovieListCardLinksProps): JSX.Element {
  const { t } = useTranslation("rankings");
  const { t: tMovie } = useTranslation("movie");

  return (
    <div className="flex flex-wrap gap-2">
      <MovieLink
        movieId={movieId}
        ariaLabel={tMovie("link.openLabel", { title })}
        className={`${linkClass} bg-primary/10 text-primary hover:bg-primary/20`}
      >
        {tMovie("link.open")}
        <ArrowRight className="h-4 w-4" />
      </MovieLink>
      {imdbId && (
        <a
          href={`https://www.imdb.com/title/${imdbId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:text-yellow-400`}
        >
          <Film className="h-4 w-4" />
          {t("moviesList.detailImdb")}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
