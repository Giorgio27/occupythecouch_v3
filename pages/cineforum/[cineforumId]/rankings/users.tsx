import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Trophy } from "lucide-react";
import { fetchUserRankings } from "@/lib/client/cineforum";
import {
  RankingHeader,
  SupplierSelect,
  RankingCard,
} from "@/components/cineforum/rankings";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import EmptyState from "@/components/cineforum/common/EmptyState";
import type {
  UserRankingDTO,
  MovieRoundRankingDTO,
  Supplier,
} from "@/lib/shared/types";

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

export default function UsersRankingPage({
  cineforumId,
  cineforumName,
}: Props) {
  const [rankings, setRankings] = useState<UserRankingDTO[]>([]);
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
      const response = await fetchUserRankings(cineforumId, {
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

  const getRatingForSupplier = (ranking: UserRankingDTO): number | null => {
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

  const getWinningRounds = (
    ranking: UserRankingDTO,
  ): MovieRoundRankingDTO[] => {
    return ranking.movie_round_rankings.filter((mrr) => mrr.round_winner);
  };

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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          Classifica Utenti
        </h1>

        <SupplierSelect
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          onSupplierChange={setSelectedSupplier}
        />

        <div className="space-y-2">
          <RankingHeader title="UTENTI" />

          {sortedRankings.map((ranking, index) => {
            const isExpanded = expandedIndex === index;
            const rating = getRatingForSupplier(ranking);
            const winningRounds = getWinningRounds(ranking);

            // Calculate position with ties
            let position = 1;
            if (index > 0) {
              const currentRating = rating ?? -1;
              const previousRating =
                getRatingForSupplier(sortedRankings[index - 1]) ?? -1;

              if (currentRating === previousRating) {
                // Same rating as previous, find the position of the first item with this rating
                for (let i = index - 1; i >= 0; i--) {
                  const iRating = getRatingForSupplier(sortedRankings[i]) ?? -1;
                  if (iRating === currentRating) {
                    position = i + 1;
                  } else {
                    break;
                  }
                }
              } else {
                // Different rating, position is index + 1
                position = index + 1;
              }
            }

            return (
              <RankingCard
                key={ranking.id}
                position={position}
                title={ranking.user}
                rating={rating}
                isExpanded={isExpanded}
                onToggle={() => setExpandedIndex(isExpanded ? null : index)}
                badges={winningRounds.map((mrr, idx) => (
                  <span
                    key={idx}
                    title={`Vincitore con "${mrr.movie}" (${mrr.round})`}
                  >
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  </span>
                ))}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-red-600 mb-3 text-sm uppercase tracking-wide">
                      Film Votati
                    </h3>

                    {ranking.movie_round_rankings.length === 0 ? (
                      <EmptyState
                        title="Nessun film votato"
                        subtitle="Questo utente non ha ancora votato alcun film"
                      />
                    ) : (
                      <div className="space-y-2">
                        {ranking.movie_round_rankings.map((mrr, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-medium text-gray-900 truncate">
                                {mrr.movie}
                              </span>
                              {mrr.round_winner && (
                                <span
                                  title="Vincitore del ciclo"
                                  className="flex-shrink-0"
                                >
                                  <Trophy className="w-4 h-4 text-yellow-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-3 flex-shrink-0 ml-4">
                              <span className="font-bold text-gray-900">
                                {mrr.average_rating?.toFixed(2) ?? "N/A"}
                              </span>
                              <span className="text-gray-400 text-xs">
                                {mrr.round}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Average ratings summary */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-sm mb-3 text-gray-700 uppercase tracking-wide">
                      Medie per Sito
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                        <div className="text-xs text-gray-600 mb-1">
                          Cineforum
                        </div>
                        <div className="font-bold text-lg text-gray-900">
                          {ranking.average_rating?.toFixed(2) ?? "N/A"}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                        <div className="text-xs text-gray-600 mb-1">TMDB</div>
                        <div className="font-bold text-lg text-gray-900">
                          {ranking.tmdb_vote?.toFixed(2) ?? "N/A"}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                        <div className="text-xs text-gray-600 mb-1">IMDB</div>
                        <div className="font-bold text-lg text-gray-900">
                          {ranking.imdb_rating?.toFixed(2) ?? "N/A"}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                        <div className="text-xs text-gray-600 mb-1">
                          Rotten T.
                        </div>
                        <div className="font-bold text-lg text-gray-900">
                          {ranking.tomatometer?.toFixed(2) ?? "N/A"}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                        <div className="text-xs text-gray-600 mb-1">
                          Metacritic
                        </div>
                        <div className="font-bold text-lg text-gray-900">
                          {ranking.metascore?.toFixed(2) ?? "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RankingCard>
            );
          })}
        </div>
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
