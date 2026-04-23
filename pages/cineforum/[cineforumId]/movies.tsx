import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
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
import MoviesSortSelect from "@/components/cineforum/movies/MoviesSortSelect";
import type { MovieStatsDTO } from "@/lib/shared/types";

type Props = {
  cineforumId: string;
  cineforumName: string;
};

type OrderCriteria = "proposals" | "wins" | "defeats";

export default function MoviesListPage({ cineforumId, cineforumName }: Props) {
  const { t } = useTranslation("rankings");
  const [movies, setMovies] = useState<MovieStatsDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderCriteria, setOrderCriteria] =
    useState<OrderCriteria>("proposals");

  useEffect(() => {
    loadMovies();
  }, [cineforumId]);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const response = await fetchMoviesList(cineforumId);
      setMovies(response.body);
    } catch (error) {
      console.error("Error loading movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedMovies = [...movies].sort((a, b) => {
    const valueA = a[orderCriteria];
    const valueB = b[orderCriteria];
    if (valueB !== valueA) return valueB - valueA;
    if (orderCriteria !== "wins" && b.wins !== a.wins) return b.wins - a.wins;
    if (orderCriteria !== "proposals" && b.proposals !== a.proposals)
      return b.proposals - a.proposals;
    return 0;
  });

  const getPosition = (index: number): number => {
    if (index === 0) return 1;
    const currentValue = sortedMovies[index][orderCriteria];
    const previousValue = sortedMovies[index - 1][orderCriteria];
    if (currentValue === previousValue) {
      for (let i = index - 1; i >= 0; i--) {
        const iValue = sortedMovies[i][orderCriteria];
        if (iValue === currentValue) {
          if (i === 0) return 1;
        } else {
          return i + 2;
        }
      }
      return 1;
    }
    return index + 1;
  };

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingCard text={t("moviesList.loading")} />
        </div>
      </CineforumLayout>
    );
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-4 sm:py-6 animate-fade-in">
        <MoviesPageHeader />

        {sortedMovies.length > 0 && <MovieStatsSummary movies={sortedMovies} />}

        <MoviesSortSelect value={orderCriteria} onChange={setOrderCriteria} />

        {sortedMovies.length === 0 ? (
          <EmptyState
            title={t("moviesList.emptyTitle")}
            subtitle={t("moviesList.emptySubtitle")}
          />
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <MoviesListTableHeader />
            {sortedMovies.map((movie, index) => (
              <MovieListCard
                key={movie.id}
                movie={movie}
                position={getPosition(index)}
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
