import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Film, Star } from "lucide-react";
import { fetchMoviesList } from "@/lib/client/cineforum/movies";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import type { MovieStatsDTO } from "@/lib/shared/types";

type Props = {
  cineforumId: string;
  cineforumName: string;
};

type OrderCriteria = "proposals" | "wins" | "defeats";

const orderCriteriaOptions = [
  { criteria: "proposals" as OrderCriteria, name: "Proposte" },
  { criteria: "wins" as OrderCriteria, name: "Vittorie" },
  { criteria: "defeats" as OrderCriteria, name: "Sconfitte" },
];

export default function MoviesListPage({ cineforumId, cineforumName }: Props) {
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

    // Primary sort by selected criteria (descending)
    if (valueB !== valueA) {
      return valueB - valueA;
    }

    // Secondary sort: if equal, sort by wins (descending)
    if (orderCriteria !== "wins" && b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    // Tertiary sort: if still equal, sort by proposals (descending)
    if (orderCriteria !== "proposals" && b.proposals !== a.proposals) {
      return b.proposals - a.proposals;
    }

    return 0;
  });

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingCard text="Caricamento film..." />
        </div>
      </CineforumLayout>
    );
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-6 sm:py-8 animate-fade-in">
        {/* Page Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Film className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Tutti i Film
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Lista completa dei film proposti nel tuo cineforum
          </p>
        </div>

        {/* Order Criteria Select */}
        <div className="mb-6">
          <label
            htmlFor="orderCriteria"
            className="block text-sm font-medium mb-2 text-muted-foreground"
          >
            Ordina per:
          </label>
          <select
            id="orderCriteria"
            value={orderCriteria}
            onChange={(e) => setOrderCriteria(e.target.value as OrderCriteria)}
            className="w-full md:w-64 px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground"
          >
            {orderCriteriaOptions.map((option) => (
              <option key={option.criteria} value={option.criteria}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        {/* Movies List */}
        {sortedMovies.length === 0 ? (
          <div className="cine-card text-center py-12 sm:py-16">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nessun film trovato
            </h3>
            <p className="text-muted-foreground text-sm">
              I film proposti appariranno qui
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {/* Header */}
            <div className="cine-card bg-primary text-primary-foreground">
              <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6">
                <div className="w-12 sm:w-16 text-center font-bold text-sm sm:text-base">
                  #
                </div>
                <div className="flex-1 font-bold text-sm sm:text-base">
                  FILM
                </div>
                <div className="w-24 sm:w-32 text-right font-bold text-sm sm:text-base">
                  Vittorie
                </div>
              </div>
            </div>

            {/* Movies */}
            {sortedMovies.map((movie, index) => {
              // Calculate position with ties
              let position = 1;
              if (index > 0) {
                const currentValue = movie[orderCriteria];
                const previousValue = sortedMovies[index - 1][orderCriteria];

                if (currentValue === previousValue) {
                  for (let i = index - 1; i >= 0; i--) {
                    const iValue = sortedMovies[i][orderCriteria];
                    if (iValue === currentValue) {
                      position = i + 1;
                    } else {
                      break;
                    }
                  }
                } else {
                  position = index + 1;
                }
              }

              return (
                <div
                  key={movie.id}
                  className="cine-card hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6">
                    <div className="w-12 sm:w-16 text-center font-bold text-lg sm:text-xl text-gradient">
                      {position}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {movie.title}
                        </span>
                        {movie.wins > 0 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div className="w-24 sm:w-32 text-right">
                      <span className="font-bold text-sm sm:text-base text-gradient">
                        {movie.wins} / {movie.proposals}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        {sortedMovies.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="cine-card text-center p-4">
              <div className="text-2xl sm:text-3xl font-bold text-gradient mb-1">
                {sortedMovies.length}
              </div>
              <div className="text-sm text-muted-foreground">Film Totali</div>
            </div>
            <div className="cine-card text-center p-4">
              <div className="text-2xl sm:text-3xl font-bold text-gradient mb-1">
                {sortedMovies.reduce((sum, m) => sum + m.proposals, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Proposte Totali
              </div>
            </div>
            <div className="cine-card text-center p-4">
              <div className="text-2xl sm:text-3xl font-bold text-gradient mb-1">
                {sortedMovies.filter((m) => m.wins > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Film Vincitori
              </div>
            </div>
          </div>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
