import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Trophy, Film, Users, Star } from "lucide-react";
import { fetchMovieRankings } from "@/lib/client/cineforum";
import {
  RankingHeader,
  SupplierSelect,
  RankingCard,
  ComparisonTable,
} from "@/components/cineforum/rankings";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import type { MovieRankingDTO, Supplier } from "@/lib/shared/types";

// Import suppliers constant
const suppliers: Supplier[] = [
  { id: "cineforum", name: "Cineforum" },
  { id: "tmdb", name: "TMDB" },
  { id: "imdb", name: "IMDB" },
  { id: "rotten_tomatoes", name: "Rotten Tomatoes" },
  { id: "metacritic", name: "Metacritic" },
];

type Props = {
  cineforumId: string;
  cineforumName: string;
};

export default function MoviesRankingPage({
  cineforumId,
  cineforumName,
}: Props) {
  const [rankings, setRankings] = useState<MovieRankingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(
    suppliers[0],
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadRankings();
  }, [cineforumId]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const response = await fetchMovieRankings(cineforumId, {
        offset: 0,
        limit: 100,
      });
      setRankings(response.body);
    } catch (error) {
      console.error("Error loading rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingForSupplier = (ranking: MovieRankingDTO): number | null => {
    switch (selectedSupplier.id) {
      case "cineforum":
        return ranking.average_rating;
      case "tmdb":
        return ranking.tmdb_vote;
      case "imdb":
        return ranking.imdb_rating;
      case "rotten_tomatoes":
        return ranking.tomatometer;
      case "metacritic":
        return ranking.metascore;
      default:
        return ranking.average_rating;
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    const ratingA = getRatingForSupplier(a) ?? -1;
    const ratingB = getRatingForSupplier(b) ?? -1;
    return ratingB - ratingA;
  });

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingCard text="Caricamento classifiche..." />
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
              Classifica Film
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Tutti i film votati dal tuo cineforum, ordinati per rating
          </p>
        </div>

        {/* Supplier Select */}
        <SupplierSelect
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          onSupplierChange={setSelectedSupplier}
        />

        {/* Rankings List */}
        {sortedRankings.length === 0 ? (
          <div className="cine-card text-center py-12 sm:py-16">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nessun film in classifica
            </h3>
            <p className="text-muted-foreground text-sm">
              I film votati appariranno qui
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <RankingHeader title="FILM" />

            {sortedRankings.map((ranking, index) => {
              const isExpanded = expandedIndex === index;
              const rating = getRatingForSupplier(ranking);

              return (
                <RankingCard
                  key={ranking.id}
                  position={index + 1}
                  title={ranking.movie}
                  rating={rating}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedIndex(isExpanded ? null : index)}
                  badges={
                    ranking.round_winner && (
                      <span
                        title={`Vincitore del ciclo: ${ranking.round}`}
                        className="flex items-center"
                      >
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                      </span>
                    )
                  }
                >
                  <div className="space-y-6">
                    {/* Round badge */}
                    <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg border border-border">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Ciclo:
                      </span>
                      <span className="font-bold text-foreground">
                        {ranking.round}
                      </span>
                    </div>

                    {/* User Votes Section */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                        <Users className="w-4 h-4" />
                        Voti Utenti
                      </h3>

                      <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {/* Header */}
                        <div className="bg-secondary/50 px-4 py-3 border-b border-border">
                          <div className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            <div className="flex-1">Utente</div>
                            <div className="w-20 sm:w-24 text-right">Voto</div>
                          </div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border">
                          {ranking.movie_votes.map((vote) => (
                            <div
                              key={vote.id}
                              className="flex items-center px-4 py-3 sm:py-4 hover:bg-secondary/30 transition-colors"
                            >
                              <div className="flex-1">
                                <span className="text-sm sm:text-base text-foreground font-medium">
                                  {vote.user}
                                </span>
                              </div>
                              <div className="w-20 sm:w-24 text-right">
                                <span className="font-bold text-sm sm:text-base text-gradient">
                                  {vote.rating.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Supplier Ratings Comparison */}
                    <ComparisonTable
                      title="Confronto Siti"
                      rows={[
                        {
                          label: "Cineforum",
                          value: ranking.average_rating,
                          difference: null,
                        },
                        {
                          label: "TMDB",
                          value: ranking.tmdb_vote,
                          difference: ranking.tmdb_difference,
                        },
                        {
                          label: "IMDB",
                          value: ranking.imdb_rating,
                          difference: ranking.imdb_difference,
                        },
                        {
                          label: "Rotten Tomatoes",
                          value: ranking.tomatometer,
                          difference: ranking.tomato_difference,
                        },
                        {
                          label: "Metacritic",
                          value: ranking.metascore,
                          difference: ranking.meta_difference,
                        },
                      ]}
                    />
                  </div>
                </RankingCard>
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
