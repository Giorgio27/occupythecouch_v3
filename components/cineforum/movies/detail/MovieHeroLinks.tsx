import { ExternalLink, Film } from "lucide-react";
import { useTranslation } from "react-i18next";

type MovieHeroLinksProps = {
  imdbId: string | null;
  homepage: string | null;
};

/** TMDB homepages are external data: only plain web links are rendered. */
const WEB_URL = /^https?:\/\//i;

const linkClass =
  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors";

/** External links of the movie: IMDb and, when it is a web URL, the official site. */
export default function MovieHeroLinks({
  imdbId,
  homepage,
}: MovieHeroLinksProps): JSX.Element | null {
  const { t } = useTranslation("movie");
  const safeHomepage = homepage && WEB_URL.test(homepage) ? homepage : null;
  if (!imdbId && !safeHomepage) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {imdbId && (
        <a
          href={`https://www.imdb.com/title/${imdbId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:text-yellow-400`}
        >
          <Film className="h-4 w-4" />
          {t("hero.imdb")}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {safeHomepage && (
        <a
          href={safeHomepage}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} bg-secondary text-foreground hover:bg-secondary/70`}
        >
          {t("hero.homepage")}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
