import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import {
  Trophy,
  Crown,
  Users,
  TrendingUp,
  Award,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Film,
  Table as TableIcon,
  LineChart as LineChartIcon,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { fetchUserRankings } from "@/lib/client/cineforum";
import { SupplierSelect, RankingCard } from "@/components/cineforum/rankings";
import UserRankingTrendChart from "@/components/cineforum/rankings/UserRankingTrendChart";
import { Badge } from "@/components/ui/badge";
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
  { id: "delta", name: "Confronto Piattaforme" },
];

const externalSuppliers: Supplier[] = [
  { id: "tmdb", name: "TMDB" },
  { id: "imdb", name: "IMDB" },
  { id: "rotten_tomatoes", name: "Rotten Tomatoes" },
  { id: "metacritic", name: "Metacritic" },
];

type Props = {
  cineforumId: string;
  cineforumName: string;
};

const sortRounds = (a: string, b: string) =>
  a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });

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
  const [deltaSortBy, setDeltaSortBy] = useState<
    "user" | "cineforum" | "tmdb" | "imdb" | "rotten_tomatoes" | "metacritic"
  >("user");
  const [deltaSortDir, setDeltaSortDir] = useState<"asc" | "desc">("asc");

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
          ranking.movie_round_rankings.forEach((mrr) => {
            allRounds.add(mrr.round);
          });
        });

        const sortedRounds = Array.from(allRounds).sort(sortRounds);
        if (sortedRounds.length > 0) {
          setRoundRange([1, sortedRounds.length]);
        }
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
      ranking.movie_round_rankings.forEach((mrr) => {
        rounds.add(mrr.round);
      });
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

  const displayedRankings = sortedAndFilteredRankings;

  // Sorted rankings for Delta table
  const sortedDeltaRankings = useMemo(() => {
    if (selectedSupplier.id !== "delta") return displayedRankings;

    return [...displayedRankings].sort((a, b) => {
      let comparison = 0;

      if (deltaSortBy === "user") {
        comparison = a.user.localeCompare(b.user);
      } else if (deltaSortBy === "cineforum") {
        const valA = a.average_rating ?? -Infinity;
        const valB = b.average_rating ?? -Infinity;
        comparison = valA - valB;
      } else {
        const cineforumA = a.average_rating ?? 0;
        const cineforumB = b.average_rating ?? 0;

        let supplierA = 0;
        let supplierB = 0;

        switch (deltaSortBy) {
          case "tmdb":
            supplierA = a.tmdb_vote ?? 0;
            supplierB = b.tmdb_vote ?? 0;
            break;
          case "imdb":
            supplierA = a.imdb_rating ?? 0;
            supplierB = b.imdb_rating ?? 0;
            break;
          case "rotten_tomatoes":
            supplierA = a.tomatometer ?? 0;
            supplierB = b.tomatometer ?? 0;
            break;
          case "metacritic":
            supplierA = a.metascore ?? 0;
            supplierB = b.metascore ?? 0;
            break;
        }

        const deltaA = cineforumA - supplierA;
        const deltaB = cineforumB - supplierB;
        comparison = deltaA - deltaB;
      }

      return deltaSortDir === "asc" ? comparison : -comparison;
    });
  }, [displayedRankings, selectedSupplier.id, deltaSortBy, deltaSortDir]);

  const toggleDeltaSort = useCallback(
    (column: typeof deltaSortBy) => {
      if (deltaSortBy === column) {
        setDeltaSortDir(deltaSortDir === "asc" ? "desc" : "asc");
      } else {
        setDeltaSortBy(column);
        setDeltaSortDir("desc");
      }
    },
    [deltaSortBy, deltaSortDir],
  );

  const renderDeltaSortIcon = (column: typeof deltaSortBy) => {
    if (column !== deltaSortBy) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    }
    return deltaSortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1" />
    );
  };

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

    return {
      totalUsers: filteredByRoundRankings.length,
      avgRating,
      totalWins,
    };
  }, [filteredByRoundRankings]);

  const getWinningRounds = (
    ranking: UserRankingDTO,
  ): MovieRoundRankingDTO[] => {
    return ranking.movie_round_rankings.filter((mrr) => mrr.round_winner);
  };

  const getPosition = (index: number, ranking: UserRankingDTO): number => {
    if (index === 0) return 1;

    const currentRating = getRatingForSupplier(ranking) ?? -1;
    const previousRating =
      getRatingForSupplier(sortedAndFilteredRankings[index - 1]) ?? -1;

    if (currentRating === previousRating) {
      for (let i = index - 1; i >= 0; i--) {
        const iRating =
          getRatingForSupplier(sortedAndFilteredRankings[i]) ?? -1;
        if (iRating !== currentRating) {
          return i + 2;
        }
      }
      return 1;
    }

    return index + 1;
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const setCardMode = (userId: string, mode: "table" | "chart") => {
    setCardViewMode((prev) => ({
      ...prev,
      [userId]: mode,
    }));
  };

  const getCardViewMode = (userId: string): "table" | "chart" => {
    return cardViewMode[userId] || "chart";
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
          <div className="cine-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("users.statUsers")}
              </p>
              <p className="text-lg font-bold text-foreground">
                {stats.totalUsers}
              </p>
            </div>
          </div>

          <div className="cine-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Film className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("users.statMoviesVoted")}
              </p>
              <p className="text-lg font-bold text-foreground">
                {totalMoviesVoted}
              </p>
            </div>
          </div>

          <div className="cine-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("users.statAverage")}
              </p>
              <p className="text-lg font-bold text-foreground">
                {stats.avgRating.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="cine-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("users.statWins")}
              </p>
              <p className="text-lg font-bold text-foreground">
                {stats.totalWins}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          className="flex flex-col gap-4 mb-6 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <SupplierSelect
              suppliers={suppliers}
              selectedSupplier={selectedSupplier}
              onSupplierChange={setSelectedSupplier}
            />

            <div className="flex-1 flex gap-3 lg:justify-end">
              <div className="relative flex-1 lg:flex-initial lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("users.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    hover:border-primary/50 transition-all duration-200 text-sm"
                />
              </div>

              {allRounds.length > 1 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 lg:px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200
                    ${
                      showFilters
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-card text-foreground hover:bg-secondary hover:border-primary/50"
                    }`}
                  title={t("users.filters")}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden lg:inline">{t("users.filters")}</span>
                </button>
              )}
              {selectedSupplier.id !== "delta" && (
                <div className="flex rounded-xl border border-border overflow-hidden bg-card">
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`px-3 lg:px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors
                    ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                    title={t("users.viewCards")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden lg:inline">
                      {t("users.viewCards")}
                    </span>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 lg:px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-l border-border
                    ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                    title={t("users.viewTable")}
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden lg:inline">
                      {t("users.viewTable")}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {showFilters && allRounds.length > 1 && (
            <div className="cine-card p-4 animate-fade-in">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                <Film className="w-4 h-4 text-primary" />
                {t("users.filterByRound")}
                <span className="text-primary font-bold">
                  {allRounds[roundRange[0] - 1]} →{" "}
                  {allRounds[roundRange[1] - 1]}
                </span>
              </label>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    {t("users.filterFrom")}{" "}
                    <span className="font-medium text-foreground">
                      {allRounds[roundRange[0] - 1]}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={allRounds.length}
                    value={roundRange[0]}
                    onChange={(e) => {
                      const newStart = parseInt(e.target.value);
                      setRoundRange([
                        newStart,
                        Math.max(newStart, roundRange[1]),
                      ]);
                    }}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    {t("users.filterTo")}{" "}
                    <span className="font-medium text-foreground">
                      {allRounds[roundRange[1] - 1]}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={allRounds.length}
                    value={roundRange[1]}
                    onChange={(e) => {
                      const newEnd = parseInt(e.target.value);
                      setRoundRange([Math.min(roundRange[0], newEnd), newEnd]);
                    }}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{allRounds[0]}</span>
                  <span>{allRounds[allRounds.length - 1]}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cards / Table view */}
        {displayedRankings.length > 0 && selectedSupplier.id !== "delta" && (
          <>
            {viewMode === "cards" ? (
              <div
                className="space-y-3 animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
              >
                {displayedRankings.map((ranking) => {
                  const globalIndex = sortedAndFilteredRankings.findIndex(
                    (r) => r.id === ranking.id,
                  );
                  const isExpanded = expandedIndex === globalIndex;
                  const rating = getRatingForSupplier(ranking);
                  const winningRounds = getWinningRounds(ranking);
                  const position = getPosition(globalIndex, ranking);

                  return (
                    <RankingCard
                      key={ranking.id}
                      position={position}
                      title={ranking.user}
                      rating={rating}
                      isExpanded={isExpanded}
                      onToggle={() =>
                        setExpandedIndex(isExpanded ? null : globalIndex)
                      }
                      badges={
                        winningRounds.length > 0 ? (
                          <div className="relative inline-flex items-center">
                            <Crown className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]" />
                            {winningRounds.length > 1 && (
                              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {winningRounds.length}
                              </span>
                            )}
                          </div>
                        ) : null
                      }
                    >
                      <div className="space-y-6">
                        <div className="flex justify-end">
                          <div className="flex rounded-lg border border-border overflow-hidden bg-card">
                            <button
                              onClick={() => setCardMode(ranking.id, "chart")}
                              className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-colors border-l border-border
                                ${getCardViewMode(ranking.id) === "chart" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                            >
                              <LineChartIcon className="w-3.5 h-3.5" />
                              {t("users.viewChart")}
                            </button>
                            <button
                              onClick={() => setCardMode(ranking.id, "table")}
                              className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-colors
                                ${getCardViewMode(ranking.id) === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                            >
                              <TableIcon className="w-3.5 h-3.5" />
                              {t("users.viewTable")}
                            </button>
                          </div>
                        </div>

                        {getCardViewMode(ranking.id) === "table" && (
                          <div>
                            <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                              <Film className="w-4 h-4" />
                              {t("users.moviesVoted")}
                            </h3>

                            {ranking.movie_round_rankings.length === 0 ? (
                              <EmptyState
                                title={t("users.noMoviesVoted")}
                                subtitle={t("users.noMoviesVotedSubtitle")}
                              />
                            ) : (
                              <div className="space-y-2">
                                {ranking.movie_round_rankings.map(
                                  (mrr, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="font-medium text-foreground truncate">
                                          {mrr.movie}
                                        </span>
                                        {mrr.round_winner && (
                                          <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                        )}
                                      </div>
                                      <div className="text-sm flex items-center gap-3 flex-shrink-0 ml-4">
                                        <span className="font-bold text-gradient tabular-nums">
                                          {mrr.average_rating?.toFixed(2) ??
                                            "N/A"}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {mrr.round}
                                        </Badge>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {getCardViewMode(ranking.id) === "chart" && (
                          <UserRankingTrendChart
                            ranking={ranking}
                            supplier={selectedSupplier}
                          />
                        )}

                        <div className="pt-4 border-t border-border">
                          <h4 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                            {t("users.platformComparison")}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[
                              {
                                label: "Cineforum",
                                value: ranking.average_rating,
                              },
                              { label: "TMDB", value: ranking.tmdb_vote },
                              { label: "IMDB", value: ranking.imdb_rating },
                              {
                                label: "Rotten T.",
                                value: ranking.tomatometer,
                              },
                              { label: "Metacritic", value: ranking.metascore },
                            ].map((stat) => (
                              <div
                                key={stat.label}
                                className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                              >
                                <div className="text-xs text-muted-foreground mb-1">
                                  {stat.label}
                                </div>
                                <div className="font-bold text-foreground tabular-nums">
                                  {stat.value?.toFixed(2) ?? "N/A"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </RankingCard>
                  );
                })}
              </div>
            ) : (
              <div
                className="cine-card-fit overflow-hidden animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("users.colUser")}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("users.colAverage")}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("users.colMovies")}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("users.colWins")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRankings.map((ranking) => {
                        const globalIndex = sortedAndFilteredRankings.findIndex(
                          (r) => r.id === ranking.id,
                        );
                        const rating = getRatingForSupplier(ranking);
                        const position = getPosition(globalIndex, ranking);
                        const wins = getWinningRounds(ranking).length;

                        return (
                          <tr
                            key={ranking.id}
                            className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                          >
                            <td className="px-4 py-3.5 text-sm font-bold text-muted-foreground tabular-nums">
                              {position}
                            </td>
                            <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                {ranking.user}
                                {wins > 0 && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums">
                              {rating !== null ? (
                                <span className="text-gradient">
                                  {rating.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-right text-muted-foreground tabular-nums">
                              {ranking.movie_round_rankings.length}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-right tabular-nums">
                              {wins > 0 ? (
                                <span className="text-yellow-500 font-bold">
                                  {wins}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Platform Comparison Section - Only show when Delta is selected */}
        {selectedSupplier.id === "delta" && displayedRankings.length > 0 && (
          <div
            className="cine-card-fit overflow-hidden mt-8 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-amber-500/5">
              <h2 className="font-black text-xl text-foreground tracking-tight flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                {t("users.comparisonTitle")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("users.comparisonSubtitle")}{" "}
                <span className="text-green-500 font-semibold">
                  {t("users.positiveValues")}
                </span>{" "}
                indicano che Cineforum vota più alto,{" "}
                <span className="text-red-500 font-semibold">
                  {t("users.negativeValues")}
                </span>{" "}
                indicano che Cineforum vota più basso.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-secondary/50 z-10 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleDeltaSort("user")}
                    >
                      <div className="flex items-center">
                        {t("users.colUser")}
                        {renderDeltaSortIcon("user")}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleDeltaSort("cineforum")}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                          <span>Cineforum</span>
                          {renderDeltaSortIcon("cineforum")}
                        </div>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {t("users.referenceLabel")}
                        </span>
                      </div>
                    </th>
                    {externalSuppliers.map((supplier) => (
                      <th
                        key={supplier.id}
                        className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-l border-border cursor-pointer hover:text-primary transition-colors"
                        colSpan={2}
                        onClick={() =>
                          toggleDeltaSort(supplier.id as typeof deltaSortBy)
                        }
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>{supplier.name}</span>
                          {renderDeltaSortIcon(
                            supplier.id as typeof deltaSortBy,
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-normal">
                          <span className="text-foreground">
                            {t("users.colMedia")}
                          </span>
                          <span className="text-amber-500">
                            {t("users.colDeltaLabel")}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedDeltaRankings.map((ranking, index) => {
                    const cineforumRating = ranking.average_rating;
                    const position = getPosition(
                      sortedAndFilteredRankings.findIndex(
                        (r) => r.id === ranking.id,
                      ),
                      ranking,
                    );

                    return (
                      <tr
                        key={ranking.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors group"
                      >
                        <td className="px-4 py-3.5 text-sm font-medium text-foreground sticky left-0 bg-card group-hover:bg-secondary/30 transition-colors z-10">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-bold tabular-nums w-6">
                              {position}.
                            </span>
                            {ranking.user}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center bg-primary/5">
                          <span className="text-sm font-bold text-primary tabular-nums">
                            {cineforumRating !== null
                              ? cineforumRating.toFixed(2)
                              : "N/A"}
                          </span>
                        </td>
                        {externalSuppliers.map((supplier) => {
                          let supplierRating: number | null = null;
                          switch (supplier.id) {
                            case "tmdb":
                              supplierRating = ranking.tmdb_vote;
                              break;
                            case "imdb":
                              supplierRating = ranking.imdb_rating;
                              break;
                            case "rotten_tomatoes":
                              supplierRating = ranking.tomatometer;
                              break;
                            case "metacritic":
                              supplierRating = ranking.metascore;
                              break;
                          }

                          const delta =
                            supplierRating !== null && cineforumRating !== null
                              ? cineforumRating - supplierRating
                              : null;

                          return (
                            <td
                              key={supplier.id}
                              className="border-l border-border"
                              colSpan={2}
                            >
                              <div className="flex items-center justify-center gap-4 px-4 py-3.5">
                                <span className="text-sm font-semibold text-foreground tabular-nums w-14 text-center">
                                  {supplierRating !== null
                                    ? supplierRating.toFixed(2)
                                    : "N/A"}
                                </span>
                                <span
                                  className={`text-sm font-bold tabular-nums w-16 text-center ${
                                    delta === null
                                      ? "text-muted-foreground"
                                      : delta > 0.5
                                        ? "text-green-600"
                                        : delta > 0.1
                                          ? "text-green-500"
                                          : delta < -0.5
                                            ? "text-red-600"
                                            : delta < -0.1
                                              ? "text-red-500"
                                              : "text-muted-foreground"
                                  }`}
                                >
                                  {delta !== null ? (
                                    <>
                                      {delta > 0 ? "+" : ""}
                                      {delta.toFixed(2)}
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/30 bg-gradient-to-r from-primary/10 to-amber-500/10">
                    <td className="px-4 py-4 text-sm font-bold text-foreground sticky left-0 bg-gradient-to-r from-primary/10 to-amber-500/10 z-10">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        {t("users.globalAverage")}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center bg-primary/10">
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {(() => {
                          const validRatings = sortedDeltaRankings
                            .map((r) => r.average_rating)
                            .filter((r): r is number => r !== null);
                          return validRatings.length > 0
                            ? (
                                validRatings.reduce((a, b) => a + b, 0) /
                                validRatings.length
                              ).toFixed(2)
                            : "N/A";
                        })()}
                      </span>
                    </td>
                    {externalSuppliers.map((supplier) => {
                      const supplierRatings = sortedDeltaRankings
                        .map((r) => {
                          switch (supplier.id) {
                            case "tmdb":
                              return r.tmdb_vote;
                            case "imdb":
                              return r.imdb_rating;
                            case "rotten_tomatoes":
                              return r.tomatometer;
                            case "metacritic":
                              return r.metascore;
                            default:
                              return null;
                          }
                        })
                        .filter((r): r is number => r !== null);

                      const avgSupplier =
                        supplierRatings.length > 0
                          ? supplierRatings.reduce((a, b) => a + b, 0) /
                            supplierRatings.length
                          : null;

                      const cineforumRatings = sortedDeltaRankings
                        .map((r) => r.average_rating)
                        .filter((r): r is number => r !== null);

                      const avgCineforum =
                        cineforumRatings.length > 0
                          ? cineforumRatings.reduce((a, b) => a + b, 0) /
                            cineforumRatings.length
                          : null;

                      const delta =
                        avgSupplier !== null && avgCineforum !== null
                          ? avgCineforum - avgSupplier
                          : null;

                      return (
                        <td
                          key={supplier.id}
                          className="border-l border-border"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center gap-4 px-4 py-4">
                            <span className="text-sm font-bold text-foreground tabular-nums w-14 text-center">
                              {avgSupplier !== null
                                ? avgSupplier.toFixed(2)
                                : "N/A"}
                            </span>
                            <span
                              className={`text-sm font-black tabular-nums w-16 text-center ${
                                delta === null
                                  ? "text-muted-foreground"
                                  : delta > 0.5
                                    ? "text-green-600"
                                    : delta > 0.1
                                      ? "text-green-500"
                                      : delta < -0.5
                                        ? "text-red-600"
                                        : delta < -0.1
                                          ? "text-red-500"
                                          : "text-muted-foreground"
                              }`}
                            >
                              {delta !== null ? (
                                <>
                                  {delta > 0 ? "+" : ""}
                                  {delta.toFixed(2)}
                                </>
                              ) : (
                                "—"
                              )}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-border bg-secondary/20">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="font-semibold text-foreground">
                  {t("users.deltaLegend")}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="text-muted-foreground">
                    {t("users.deltaHighDesc")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">
                    {t("users.deltaHighMedDesc")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                  <span className="text-muted-foreground">
                    {t("users.deltaNeutralDesc")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-muted-foreground">
                    {t("users.deltaLowMedDesc")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span className="text-muted-foreground">
                    {t("users.deltaLowDesc")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && displayedRankings.length === 0 && (
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
