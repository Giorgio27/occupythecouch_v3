import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { fetchMoviesList } from "@/lib/client/cineforum/movies";
import {
  MoviesListTableHeader,
  MovieStatsSummary,
  MovieListCard,
} from "@/components/cineforum/rankings/movies-list";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import EmptyState from "@/components/cineforum/common/EmptyState";
import MoviesPageHeader from "@/components/cineforum/movies/MoviesPageHeader";
import MoviesFilterTabs, {
  type MovieFilter,
} from "@/components/cineforum/movies/MoviesFilterTabs";
import MoviesSearchInput from "@/components/cineforum/movies/MoviesSearchInput";
import type { MovieStatsDTO } from "@/lib/shared/types";

type Props = {
  cineforumId: string;
  cineforumName: string;
};

export default function MoviesListPage({ cineforumId, cineforumName }: Props) {
  const { t } = useTranslation("rankings");
  const [movies, setMovies] = useState<MovieStatsDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MovieFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    [],
  );

  useEffect(() => {
    loadMovies();
  }, [cineforumId]);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const response = await fetchMoviesList(cineforumId);
      // Sort by proposals desc, then wins desc as tiebreaker
      const sorted = [...response.body].sort((a, b) => {
        if (b.proposals !== a.proposals) return b.proposals - a.proposals;
        return b.wins - a.wins;
      });
      setMovies(sorted);
    } catch (error) {
      console.error("Error loading movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: movies.length,
      watched: movies.filter((m) => m.wins > 0).length,
      unwatched: movies.filter((m) => m.wins === 0).length,
    }),
    [movies],
  );

  const filteredMovies = useMemo(() => {
    let result = movies;

    if (filter === "watched") result = result.filter((m) => m.wins > 0);
    else if (filter === "unwatched")
      result = result.filter((m) => m.wins === 0);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q));
    }

    return result;
  }, [movies, filter, search]);

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-100">
          <LoadingCard text={t("moviesList.loading")} />
        </div>
      </CineforumLayout>
    );
  }

  const isSearching = search.trim().length > 0;

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-4 sm:py-6 animate-fade-in">
        <MoviesPageHeader />

        {movies.length > 0 && <MovieStatsSummary movies={movies} />}

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <MoviesFilterTabs
            value={filter}
            onChange={(f) => {
              setFilter(f);
              setSearch("");
            }}
            counts={counts}
          />
          <MoviesSearchInput value={search} onChange={setSearch} />
        </div>

        {filteredMovies.length === 0 ? (
          isSearching ? (
            <EmptyState
              title={t("moviesList.emptySearchTitle")}
              subtitle={t("moviesList.emptySearchSubtitle", { query: search })}
            />
          ) : (
            <EmptyState
              title={t("moviesList.emptyTitle")}
              subtitle={t("moviesList.emptySubtitle")}
            />
          )
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <MoviesListTableHeader />
            {filteredMovies.map((movie, index) => (
              <MovieListCard
                key={movie.id}
                movie={movie}
                index={index}
                isExpanded={expandedId === movie.id}
                onToggle={() => handleToggle(movie.id)}
              />
            ))}
          </div>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
