import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Trophy, Users, Award, Film } from "lucide-react";
import { fetchUserRankings } from "@/lib/client/cineforum";
import {
  SupplierSelectBar,
  UserRankingList,
  ComparisonSection,
} from "@/components/cineforum/rankings";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import type { UserRankingDTO, Supplier } from "@/lib/shared/types";

const suppliers: Supplier[] = [
  { id: "cineforum", name: "Cineforum" },
  { id: "tmdb", name: "TMDB" },
  { id: "imdb", name: "IMDB" },
  { id: "rotten_tomatoes", name: "Rotten Tomatoes" },
  { id: "metacritic", name: "Metacritic" },
  { id: "delta", name: "Confronto Piattaforme" },
];

type Props = {
  cineforumId: string;
  cineforumName: string;
};

const sortRounds = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

export default function UsersRankingPage({
  cineforumId,
  cineforumName,
}: Props) {
  const { t } = useTranslation("rankings");

  const [rankings, setRankings] = useState<UserRankingDTO[]>([]);
  const [totalMoviesVoted, setTotalMoviesVoted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(
    suppliers[0],
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [roundRange, setRoundRange] = useState<[number, number]>([0, 0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<
    Record<string, "table" | "chart">
  >({});

  const loadRankings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchUserRankings(cineforumId, {
        offset: 0,
        limit: 100,
      });

      setRankings(response.body);
      setTotalMoviesVoted(response.total_movies_voted ?? 0);

      if (response.body.length > 0) {
        const allRounds = new Set<string>();
        response.body.forEach((ranking) => {
          ranking.movie_round_rankings.forEach((mrr) =>
            allRounds.add(mrr.round),
          );
        });
        const sorted = Array.from(allRounds).sort(sortRounds);
        if (sorted.length > 0) setRoundRange([1, sorted.length]);
      }
    } catch (error) {
      console.error("Error loading rankings:", error);
    } finally {
      setLoading(false);
    }
  }, [cineforumId]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const allRounds = useMemo(() => {
    const rounds = new Set<string>();
    rankings.forEach((ranking) => {
      ranking.movie_round_rankings.forEach((mrr) => rounds.add(mrr.round));
    });
    return Array.from(rounds).sort(sortRounds);
  }, [rankings]);

  const filteredByRoundRankings = useMemo(() => {
    if (allRounds.length === 0) return rankings;

    const selectedRounds = allRounds.slice(roundRange[0] - 1, roundRange[1]);

    return rankings.map((ranking) => {
      const filteredMovieRounds = ranking.movie_round_rankings.filter((mrr) =>
        selectedRounds.includes(mrr.round),
      );
      const validRatings = filteredMovieRounds
        .map((mrr) => mrr.average_rating)
        .filter((r): r is number => r !== null);
      const newAvgRating =
        validRatings.length > 0
          ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
          : null;

      return {
        ...ranking,
        movie_round_rankings: filteredMovieRounds,
        average_rating: newAvgRating,
      };
    });
  }, [rankings, roundRange, allRounds]);

  const getRatingForSupplier = useCallback(
    (ranking: UserRankingDTO): number | null => {
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
    },
    [selectedSupplier],
  );

  const sortedAndFilteredRankings = useMemo(() => {
    let result = [...filteredByRoundRankings].sort((a, b) => {
      const ratingA = getRatingForSupplier(a) ?? -1;
      const ratingB = getRatingForSupplier(b) ?? -1;
      return ratingB - ratingA;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.user.toLowerCase().includes(query));
    }

    return result;
  }, [filteredByRoundRankings, getRatingForSupplier, searchQuery]);

  const getPosition = useCallback(
    (index: number, ranking: UserRankingDTO): number => {
      if (index === 0) return 1;
      const currentRating = getRatingForSupplier(ranking) ?? -1;
      const previousRating =
        getRatingForSupplier(sortedAndFilteredRankings[index - 1]) ?? -1;
      if (currentRating === previousRating) {
        for (let i = index - 1; i >= 0; i--) {
          if (
            (getRatingForSupplier(sortedAndFilteredRankings[i]) ?? -1) !==
            currentRating
          ) {
            return i + 2;
          }
        }
        return 1;
      }
      return index + 1;
    },
    [getRatingForSupplier, sortedAndFilteredRankings],
  );

  const stats = useMemo(() => {
    const withRatings = filteredByRoundRankings.filter(
      (u) => u.average_rating !== null,
    );
    const avgRating =
      withRatings.length > 0
        ? withRatings.reduce((sum, u) => sum + (u.average_rating || 0), 0) /
          withRatings.length
        : 0;
    const totalWins = filteredByRoundRankings.reduce(
      (sum, u) =>
        sum + u.movie_round_rankings.filter((m) => m.round_winner).length,
      0,
    );
    return { totalUsers: filteredByRoundRankings.length, avgRating, totalWins };
  }, [filteredByRoundRankings]);

  const setCardMode = (userId: string, mode: "table" | "chart") => {
    setCardViewMode((prev) => ({ ...prev, [userId]: mode }));
  };

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingCard text={t("users.loading")} />
        </div>
      </CineforumLayout>
    );
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-8 sm:mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 glow-red-soft">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("users.pageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("users.pageSubtitle")}
          </p>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          {[
            {
              icon: <Users className="w-5 h-5 text-primary" />,
              bg: "bg-primary/10",
              label: t("users.statUsers"),
              value: stats.totalUsers,
            },
            {
              icon: <Film className="w-5 h-5 text-green-500" />,
              bg: "bg-green-500/10",
              label: t("users.statMoviesVoted"),
              value: totalMoviesVoted,
            },
            {
              icon: <Award className="w-5 h-5 text-amber-500" />,
              bg: "bg-amber-500/10",
              label: t("users.statAverage"),
              value: stats.avgRating.toFixed(2),
            },
            {
              icon: <Trophy className="w-5 h-5 text-yellow-500" />,
              bg: "bg-yellow-500/10",
              label: t("users.statWins"),
              value: stats.totalWins,
            },
          ].map(({ icon, bg, label, value }) => (
            <div key={label} className="cine-card p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <SupplierSelectBar
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          onSupplierChange={setSelectedSupplier}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((v) => !v)}
          allRounds={allRounds}
          roundRange={roundRange}
          onRoundRangeChange={setRoundRange}
        />

        {/* Cards / Table view */}
        {sortedAndFilteredRankings.length > 0 &&
          selectedSupplier.id !== "delta" && (
            <UserRankingList
              displayedRankings={sortedAndFilteredRankings}
              sortedAndFilteredRankings={sortedAndFilteredRankings}
              selectedSupplier={selectedSupplier}
              viewMode={viewMode}
              expandedIndex={expandedIndex}
              cardViewMode={cardViewMode}
              onToggleExpand={setExpandedIndex}
              onSetCardMode={setCardMode}
              getRatingForSupplier={getRatingForSupplier}
              getPosition={getPosition}
            />
          )}

        {/* Platform comparison (delta) */}
        {selectedSupplier.id === "delta" &&
          sortedAndFilteredRankings.length > 0 && (
            <ComparisonSection
              displayedRankings={sortedAndFilteredRankings}
              sortedAndFilteredRankings={sortedAndFilteredRankings}
              getPosition={getPosition}
            />
          )}

        {/* Empty state */}
        {!loading && sortedAndFilteredRankings.length === 0 && (
          <div className="cine-card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? t("users.noResults") : t("users.emptyTitle")}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? t("users.noResultsQuery", { query: searchQuery })
                : t("users.emptySubtitle")}
            </p>
          </div>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
