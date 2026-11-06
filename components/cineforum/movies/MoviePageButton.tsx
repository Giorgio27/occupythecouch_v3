import { ChevronRight, Clapperboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import MovieLink from "./MovieLink";

type MoviePageButtonProps = {
  movieId: string;
  title: string;
};

/** "Movie page" pill for expanded panels, where the title itself is the toggle. */
export default function MoviePageButton({
  movieId,
  title,
}: MoviePageButtonProps): JSX.Element {
  const { t } = useTranslation("movie");

  return (
    <MovieLink
      movieId={movieId}
      ariaLabel={t("link.openLabel", { title })}
      className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
    >
      <Clapperboard className="h-4 w-4" />
      {t("link.open")}
      <ChevronRight className="h-4 w-4" />
    </MovieLink>
  );
}
