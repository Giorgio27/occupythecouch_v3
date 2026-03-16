import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Film, ChevronDown, ChevronUp } from "lucide-react";
import { fetchDirectorRankings } from "@/lib/client/cineforum/rankings";
import { RankingHeader, RankingCard } from "@/components/cineforum/rankings";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import type { DirectorRankingDTO } from "@/lib/shared/types";

type Props = {
  cineforumId: string;
  cineforumName: string;
};

type OrderCriteria = "average_rating" | "count";

const orderCriteriaOptions = [
  { criteria: "average_rating" as OrderCriteria, name: "Media Voti" },
  { criteria: "count" as OrderCriteria, name: "Numero Film" },
];

export default function DirectorsRankingPage({
  cineforumId,
  cineforumName,
}: Props) {
  const [directors, setDirectors] = useState<DirectorRankingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderCriteria, setOrderCriteria] =
    useState<OrderCriteria>("average_rating");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadDirectors();
  }, [cineforumId]);

  const loadDirectors = async () => {
    try {
      setLoading(true);
      const response = await fetchDirectorRankings(cineforumId);
      setDirectors(response.body);
    } catch (error) {
      console.error("Error loading directors:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedDirectors = [...directors].sort((a, b) => {
    if (orderCriteria === "average_rating") {
      return b.average_rating - a.average_rating;
    } else {
      return b.count - a.count;
    }
  });

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingCard text="Caricamento registi..." />
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
              Classifica Registi
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            I registi dei film votati dal tuo cineforum
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

        {/* Directors List */}
        {sortedDirectors.length === 0 ? (
          <div className="cine-card text-center py-12 sm:py-16">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nessun regista in classifica
            </h3>
            <p className="text-muted-foreground text-sm">
              I registi dei film votati appariranno qui
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {/* Custom Header for Directors */}
            <div className="cine-card bg-primary text-primary-foreground">
              <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6">
                <div className="w-12 sm:w-16 text-center font-bold text-sm sm:text-base">
                  #
                </div>
                <div className="flex-1 font-bold text-sm sm:text-base">
                  REGISTI
                </div>
                <div className="w-16 sm:w-20 text-center font-bold text-sm sm:text-base">
                  N°
                </div>
                <div className="w-20 sm:w-24 text-right font-bold text-sm sm:text-base">
                  Voto
                </div>
                <div className="w-8 sm:w-10"></div>
              </div>
            </div>

            {sortedDirectors.map((director, index) => {
              const isExpanded = expandedIndex === index;

              // Calculate position with ties
              let position = 1;
              if (index > 0) {
                const currentValue =
                  orderCriteria === "average_rating"
                    ? director.average_rating
                    : director.count;
                const previousValue =
                  orderCriteria === "average_rating"
                    ? sortedDirectors[index - 1].average_rating
                    : sortedDirectors[index - 1].count;

                if (currentValue === previousValue) {
                  for (let i = index - 1; i >= 0; i--) {
                    const iValue =
                      orderCriteria === "average_rating"
                        ? sortedDirectors[i].average_rating
                        : sortedDirectors[i].count;
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
                  key={director.name}
                  className="cine-card hover:shadow-lg transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="w-full"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6">
                      <div className="w-12 sm:w-16 text-center font-bold text-lg sm:text-xl text-gradient">
                        {position}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {director.name}
                        </span>
                      </div>
                      <div className="w-16 sm:w-20 text-center">
                        <span className="font-bold text-sm sm:text-base text-muted-foreground">
                          {director.count}
                        </span>
                      </div>
                      <div className="w-20 sm:w-24 text-right">
                        <span className="font-bold text-sm sm:text-base text-gradient">
                          {director.average_rating.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-8 sm:w-10 flex justify-center">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-4 sm:px-6 py-4 sm:py-6 bg-secondary/30">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">
                        Film
                      </h3>

                      <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {/* Header */}
                        <div className="bg-secondary/50 px-4 py-3 border-b border-border">
                          <div className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            <div className="flex-1">Titolo</div>
                            <div className="w-20 sm:w-24 text-right">Voto</div>
                          </div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border">
                          {director.movies
                            .sort((a, b) => b.average_rating - a.average_rating)
                            .map((movie, idx) => (
                              <div
                                key={idx}
                                className="flex items-center px-4 py-3 sm:py-4 hover:bg-secondary/30 transition-colors"
                              >
                                <div className="flex-1">
                                  <span className="text-sm sm:text-base text-foreground font-medium">
                                    {movie.title}
                                  </span>
                                </div>
                                <div className="w-20 sm:w-24 text-right">
                                  <span className="font-bold text-sm sm:text-base text-gradient">
                                    {movie.average_rating.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
