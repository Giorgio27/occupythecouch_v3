import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Drama,
  Film,
  Star,
  Trophy,
  Eye,
  Heart,
  ChevronDown,
} from "lucide-react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { LoadingCard, StatCard, EmptyState } from "@/components/cineforum/common";
import MoviePoster from "@/components/ui/MoviePoster";
import { fetchGenreStats } from "@/lib/client/cineforum";
import type { GenreStatDTO, GenreMovieDTO } from "@/lib/shared/types";

type Props = { cineforumId: string; cineforumName: string };

/** A genre needs at least this many rated movies to qualify as "favourite". */
const MIN_FILMS_FOR_FAVOURITE = 3;

type SortKey = "count" | "rating";

/** Tailwind text colour for a club rating on the 1–5 scale. */
function ratingColor(rating: number | null): string {
  if (rating === null) return "text-muted-foreground";
  if (rating >= 4) return "text-emerald-500";
  if (rating >= 3) return "text-amber-500";
  return "text-red-500";
}

function MoviePill({ movie }: { movie: GenreMovieDTO }) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 hover:shadow-md transition-all duration-200">
      <MoviePoster
        imageMedium={movie.imageMedium}
        poster={movie.poster}
        image={movie.image}
        imdbId={movie.imdbId}
        alt={movie.title}
        className="w-10 h-14 object-cover rounded-md shrink-0 shadow"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">
          {movie.title}
        </p>
        {movie.director && (
          <p className="text-xs text-muted-foreground truncate">
            {movie.director}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {movie.round}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span
          className={`inline-flex items-center gap-1 font-bold text-sm tabular-nums ${ratingColor(
            movie.rating,
          )}`}
        >
          <Star className="w-3.5 h-3.5" />
          {movie.rating !== null ? movie.rating.toFixed(2) : "—"}
        </span>
      </div>
    </div>
  );
}

export default function GenresPage({ cineforumId, cineforumName }: Props) {
  const { t } = useTranslation("rankings");
  const [data, setData] = useState<GenreStatDTO[]>([]);
  const [totalFilms, setTotalFilms] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchGenreStats(cineforumId)
      .then((res) => {
        setData(res.body);
        setTotalFilms(res.total_films);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cineforumId]);

  const sorted = useMemo(() => {
    const copy = [...data];
    if (sortKey === "count") {
      copy.sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
    } else {
      copy.sort(
        (a, b) =>
          (b.average_rating ?? -1) - (a.average_rating ?? -1) ||
          b.count - a.count,
      );
    }
    return copy;
  }, [data, sortKey]);

  const maxCount = useMemo(
    () => Math.max(...data.map((g) => g.count), 1),
    [data],
  );

  const favourite = useMemo(() => {
    const eligible = data.filter(
      (g) => g.average_rating !== null && g.count >= MIN_FILMS_FOR_FAVOURITE,
    );
    if (eligible.length === 0) return null;
    return eligible.reduce((best, g) =>
      g.average_rating! > best.average_rating! ? g : best,
    );
  }, [data]);

  const mostWatched = useMemo(
    () =>
      data.length > 0
        ? data.reduce((b, g) => (g.count > b.count ? g : b))
        : null,
    [data],
  );

  const SortButton = ({
    value,
    icon,
    label,
  }: {
    value: SortKey;
    icon: ReactNode;
    label: string;
  }) => {
    const active = sortKey === value;
    return (
      <button
        onClick={() => {
          setSortKey(value);
          setExpanded(null);
        }}
        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-100">
          <LoadingCard text={t("genres.loading")} />
        </div>
      </CineforumLayout>
    );
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 glow-red-soft">
              <Drama className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("genres.pageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("genres.pageSubtitle")}
          </p>
        </div>

        {data.length === 0 ? (
          <EmptyState
            icon={<Drama className="w-8 h-8 text-muted-foreground" />}
            title={t("genres.emptyTitle")}
            subtitle={t("genres.emptySubtitle")}
          />
        ) : (
          <>
            {/* Summary stats */}
            <div
              className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              <StatCard
                icon={<Drama className="w-5 h-5 text-primary" />}
                iconBg="bg-primary/10"
                label={t("genres.statGenres")}
                value={data.length}
              />
              <StatCard
                icon={<Film className="w-5 h-5 text-blue-500" />}
                iconBg="bg-blue-500/10"
                label={t("genres.statFilms")}
                value={totalFilms}
              />
              <StatCard
                icon={<Eye className="w-5 h-5 text-violet-500" />}
                iconBg="bg-violet-500/10"
                label={t("genres.statMostWatched")}
                value={mostWatched ? mostWatched.genre : "—"}
              />
              <StatCard
                icon={<Heart className="w-5 h-5 text-emerald-500" />}
                iconBg="bg-emerald-500/10"
                label={t("genres.statFavourite")}
                value={favourite ? favourite.genre : "—"}
                tooltip={t("genres.statFavouriteTooltip", {
                  count: MIN_FILMS_FOR_FAVOURITE,
                })}
              />
            </div>

            {/* Sort toggle */}
            <div
              className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1 animate-fade-in-up"
              style={{ animationDelay: "150ms" }}
            >
              <SortButton
                value="count"
                icon={<Eye className="w-4 h-4" />}
                label={t("genres.sortMostWatched")}
              />
              <SortButton
                value="rating"
                icon={<Heart className="w-4 h-4" />}
                label={t("genres.sortMostLoved")}
              />
            </div>

            {/* Genre bars */}
            <div
              className="space-y-2 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              {sorted.map((g) => {
                const isOpen = expanded === g.genre;
                const widthPct = Math.max((g.count / maxCount) * 100, 6);
                return (
                  <div
                    key={g.genre}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : g.genre)}
                      className="w-full px-4 py-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-sm text-foreground truncate">
                              {g.genre}
                            </span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${ratingColor(
                                  g.average_rating,
                                )}`}
                              >
                                <Star className="w-3.5 h-3.5" />
                                {g.average_rating !== null
                                  ? g.average_rating.toFixed(2)
                                  : "—"}
                              </span>
                              <span className="text-xs font-semibold text-muted-foreground tabular-nums w-14 text-right">
                                {t("genres.filmsCount", { count: g.count })}
                              </span>
                            </div>
                          </div>
                          {/* Count bar */}
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-primary to-primary/60 transition-all duration-500"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          {[...g.movies]
                            .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
                            .map((movie) => (
                              <MoviePill
                                key={`${g.genre}-${movie.id}`}
                                movie={movie}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
