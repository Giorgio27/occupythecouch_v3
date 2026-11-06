import { Clapperboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/cineforum/common";
import MovieLink from "@/components/cineforum/movies/MovieLink";
import type { MovieRelatedDTO } from "@/lib/shared/types";

type MovieSameDirectorProps = {
  director: string;
  movies: MovieRelatedDTO[];
};

/** Other club movies by the same director, each linking to its own page. */
export default function MovieSameDirector({
  director,
  movies,
}: MovieSameDirectorProps): JSX.Element {
  const { t } = useTranslation("movie");

  return (
    <section className="mb-8">
      <SectionHeader
        icon={<Clapperboard className="w-4 h-4" />}
        title={t("sameDirector.title", { director })}
        subtitle={t("sameDirector.subtitle")}
      />
      <ul className="grid gap-2 sm:grid-cols-2">
        {movies.map((movie) => (
          <li key={movie.id}>
            <MovieLink
              movieId={movie.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50"
            >
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {movie.title}
                {movie.year && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({movie.year})
                  </span>
                )}
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {movie.averageRating === null ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {t("sameDirector.notWatched")}
                  </span>
                ) : (
                  <span className="text-gradient">
                    {movie.averageRating.toFixed(2)}
                  </span>
                )}
              </span>
            </MovieLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
