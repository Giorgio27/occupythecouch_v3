import { Calendar, Clock, Globe, User, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import MoviePoster from "@/components/ui/MoviePoster";
import MovieHeroLinks from "./MovieHeroLinks";
import MovieOverview from "./MovieOverview";
import type { MovieInfoDTO } from "@/lib/shared/types";

type MovieHeroProps = { movie: MovieInfoDTO };

type MetaItemProps = { icon: ReactNode; children: ReactNode };

function MetaItem({ icon, children }: MetaItemProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      {icon}
      <span className="font-medium text-foreground">{children}</span>
    </span>
  );
}

/** Poster, title and static metadata of the movie. */
export default function MovieHero({ movie }: MovieHeroProps): JSX.Element {
  const { t } = useTranslation("movie");
  const iconClass = "h-4 w-4 shrink-0 text-primary";

  return (
    // Phones: poster beside the title, text below at full width, so the title
    // is above the fold. From `sm`: poster column on the left, all text beside it.
    // Static card (no hover state): nothing here is clickable as a whole.
    <section className="mb-6 grid grid-cols-[6rem_1fr] gap-x-4 gap-y-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-[11rem_1fr] sm:gap-x-6 sm:p-6">
      <div className="sm:row-span-2">
        <MoviePoster
          imageMedium={movie.imageMedium}
          poster={movie.poster}
          image={movie.image}
          imdbId={movie.imdbId}
          alt={movie.title}
          className="w-full rounded-xl border border-border object-cover shadow-md"
          placeholderClassName="w-full aspect-[2/3] rounded-xl border border-border bg-muted flex items-center justify-center"
        />
      </div>

      <div className="min-w-0 space-y-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-3xl">
            {movie.title}
          </h1>
          {movie.tagline && (
            <p className="mt-1 text-sm italic text-muted-foreground">
              {movie.tagline}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {movie.year && (
            <MetaItem icon={<Calendar className={iconClass} />}>
              {movie.year}
            </MetaItem>
          )}
          {movie.runtime && (
            <MetaItem icon={<Clock className={iconClass} />}>
              <span className="tabular-nums">
                {t("hero.minutes", { count: movie.runtime })}
              </span>
            </MetaItem>
          )}
          {movie.director && (
            <MetaItem icon={<User className={iconClass} />}>
              <span className="sr-only">{t("hero.directedBy")} </span>
              {movie.director}
            </MetaItem>
          )}
          {movie.countries.length > 0 && (
            <MetaItem icon={<Globe className={iconClass} />}>
              <span className="sr-only">{t("hero.countries")} </span>
              {movie.countries.join(", ")}
            </MetaItem>
          )}
        </div>

        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {movie.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-2 min-w-0 space-y-3 sm:col-span-1 sm:col-start-2">
        {movie.overview && <MovieOverview text={movie.overview} />}
        {movie.actors && (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="font-medium text-foreground">
                {t("hero.cast")}:{" "}
              </span>
              {movie.actors}
            </span>
          </p>
        )}

        <MovieHeroLinks imdbId={movie.imdbId} homepage={movie.homepage} />
      </div>
    </section>
  );
}
