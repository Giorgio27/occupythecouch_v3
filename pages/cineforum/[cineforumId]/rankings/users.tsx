import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";
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
  LineChart as LineChartIcon,
  Table as TableIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchUserRankings } from "@/lib/client/cineforum";
import { SupplierSelect, RankingCard } from "@/components/cineforum/rankings";
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
  const [roundRange, setRoundRange] = useState<[number, number]>([0, 0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<
    Record<string, "table" | "chart">
  >({}); // Track view mode per user card

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

      // Initialize round range based on available rounds
      if (response.body.length > 0) {
        const allRounds = new Set<string>();
        response.body.forEach((ranking) => {
          ranking.movie_round_rankings.forEach((mrr) => {
            allRounds.add(mrr.round);
          });
        });
        const sortedRounds = Array.from(allRounds).sort();
        if (sortedRounds.length > 0) {
          setRoundRange([1, sortedRounds.length]);
        }
      }
    } catch (error) {
      console.error("Error loading rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique rounds sorted
  const allRounds = useMemo(() => {
    const rounds = new Set<string>();
    rankings.forEach((ranking) => {
      ranking.movie_round_rankings.forEach((mrr) => {
        rounds.add(mrr.round);
      });
    });
    return Array.from(rounds).sort();
  }, [rankings]);

  // Filter rankings based on selected round range
  const filteredByRoundRankings = useMemo(() => {
    if (allRounds.length === 0) return rankings;

    const selectedRounds = allRounds.slice(roundRange[0] - 1, roundRange[1]);

    return rankings.map((ranking) => {
      const filteredMovieRounds = ranking.movie_round_rankings.filter((mrr) =>
        selectedRounds.includes(mrr.round),
      );

      // Recalculate average rating for filtered rounds
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

  // Sort and filter by search
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
  }, [filteredByRoundRankings, selectedSupplier, searchQuery]);

  // Show all users without pagination
  const displayedRankings = sortedAndFilteredRankings;

  // Stats
  const stats = useMemo(() => {
    const withRatings = filteredByRoundRankings.filter(
      (u) => u.average_rating !== null,
    );
    const avgRating =
      withRatings.length > 0
        ? withRatings.reduce((sum, u) => sum + (u.average_rating || 0), 0) /
          withRatings.length
        : 0;
    const totalVotes = filteredByRoundRankings.reduce(
      (sum, u) => sum + u.movie_round_rankings.length,
      0,
    );
    const totalWins = filteredByRoundRankings.reduce(
      (sum, u) =>
        sum + u.movie_round_rankings.filter((m) => m.round_winner).length,
      0,
    );

    return {
      totalUsers: filteredByRoundRankings.length,
      activeUsers: withRatings.length,
      avgRating,
      totalVotes,
      totalWins,
    };
  }, [filteredByRoundRankings]);

  const getWinningRounds = (
    ranking: UserRankingDTO,
  ): MovieRoundRankingDTO[] => {
    return ranking.movie_round_rankings.filter((mrr) => mrr.round_winner);
  };

  // Calculate position with ties
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

  const toggleCardViewMode = (userId: string) => {
    setCardViewMode((prev) => ({
      ...prev,
      [userId]: prev[userId] === "chart" ? "table" : "chart",
    }));
  };

  const getCardViewMode = (userId: string): "table" | "chart" => {
    return cardViewMode[userId] || "table";
  };

  // Prepare chart data for a user
  const prepareChartData = (ranking: UserRankingDTO) => {
    const sortedRounds = [...ranking.movie_round_rankings].sort((a, b) => {
      return a.round.localeCompare(b.round);
    });

    return sortedRounds.map((mrr, index) => ({
      index: index + 1,
      round: mrr.round,
      rating: mrr.average_rating || 0,
      movie: mrr.movie,
      // Truncate long movie titles for display
      movieShort:
        mrr.movie.length > 25 ? mrr.movie.substring(0, 22) + "..." : mrr.movie,
    }));
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
      <div className="py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-8 sm:mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 glow-red-soft">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Classifica Utenti
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Voti medi degli utenti del cineforum
          </p>
        </div>

        {/* Stats Cards */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="cine-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Utenti</p>
              <p className="text-lg font-bold text-foreground">
                {stats.totalUsers}
              </p>
            </div>
          </div>
          <div className="cine-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attivi</p>
              <p className="text-lg font-bold text-foreground">
                {stats.activeUsers}
              </p>
            </div>
          </div>
          <div className="cine-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Media</p>
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
              <p className="text-xs text-muted-foreground">Vittorie</p>
              <p className="text-lg font-bold text-foreground">
                {stats.totalWins}
              </p>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div
          className="flex flex-col gap-4 mb-6 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <SupplierSelect
              suppliers={suppliers}
              selectedSupplier={selectedSupplier}
              onSupplierChange={setSelectedSupplier}
            />

            <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:justify-end">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cerca utente..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    hover:border-primary/50 transition-all duration-200 text-sm"
                />
              </div>

              {/* Filters Toggle */}
              {allRounds.length > 1 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all duration-200
                    ${
                      showFilters
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-card text-foreground hover:bg-secondary hover:border-primary/50"
                    }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filtri</span>
                </button>
              )}

              {/* View Toggle */}
              <div className="flex rounded-xl border border-border overflow-hidden bg-card">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors
                    ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors border-l border-border
                    ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Tabella</span>
                </button>
              </div>
            </div>
          </div>

          {/* Round Range Slider */}
          {showFilters && allRounds.length > 1 && (
            <div className="cine-card p-4 animate-fade-in">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                <Film className="w-4 h-4 text-primary" />
                Filtra per Round:
                <span className="text-primary font-bold">
                  {allRounds[roundRange[0] - 1]} →{" "}
                  {allRounds[roundRange[1] - 1]}
                </span>
              </label>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Inizio:{" "}
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
                    Fine:{" "}
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

        {/* Rankings List */}
        {displayedRankings.length > 0 && (
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
                        {/* View Toggle */}
                        <div className="flex justify-end">
                          <div className="flex rounded-lg border border-border overflow-hidden bg-card">
                            <button
                              onClick={() => toggleCardViewMode(ranking.id)}
                              className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-colors
                                ${getCardViewMode(ranking.id) === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                            >
                              <TableIcon className="w-3.5 h-3.5" />
                              Tabella
                            </button>
                            <button
                              onClick={() => toggleCardViewMode(ranking.id)}
                              className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-colors border-l border-border
                                ${getCardViewMode(ranking.id) === "chart" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                            >
                              <LineChartIcon className="w-3.5 h-3.5" />
                              Grafico
                            </button>
                          </div>
                        </div>

                        {/* Film Votati - Table View */}
                        {getCardViewMode(ranking.id) === "table" && (
                          <div>
                            <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                              <Film className="w-4 h-4" />
                              Film Votati
                            </h3>

                            {ranking.movie_round_rankings.length === 0 ? (
                              <EmptyState
                                title="Nessun film votato"
                                subtitle="Questo utente non ha ancora votato alcun film"
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

                        {/* Chart View */}
                        {getCardViewMode(ranking.id) === "chart" && (
                          <div>
                            <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                              <LineChartIcon className="w-4 h-4" />
                              Andamento Voti
                            </h3>

                            {ranking.movie_round_rankings.length === 0 ? (
                              <EmptyState
                                title="Nessun film votato"
                                subtitle="Questo utente non ha ancora votato alcun film"
                              />
                            ) : (
                              <div className="w-full h-[400px] sm:h-[500px] mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={prepareChartData(ranking)}
                                    margin={{
                                      top: 20,
                                      right: 20,
                                      left: 0,
                                      bottom: 80,
                                    }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="hsl(var(--border))"
                                      opacity={0.3}
                                    />
                                    <XAxis
                                      dataKey="movieShort"
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                      interval={0}
                                      tick={(props) => {
                                        // Hide movie names on small screens
                                        if (
                                          typeof window !== "undefined" &&
                                          window.innerWidth < 640
                                        ) {
                                          return null;
                                        }
                                        return (
                                          <text
                                            x={props.x}
                                            y={props.y}
                                            dy={16}
                                            textAnchor="end"
                                            fill="hsl(var(--foreground))"
                                            fontSize={10}
                                            transform={`rotate(-45 ${props.x} ${props.y})`}
                                          >
                                            {props.payload.value}
                                          </text>
                                        );
                                      }}
                                      stroke="hsl(var(--border))"
                                    />
                                    <YAxis
                                      domain={[0, 5]}
                                      ticks={[0, 1, 2, 3, 4, 5]}
                                      tick={{
                                        fill: "hsl(var(--foreground))",
                                        fontSize: 12,
                                      }}
                                      stroke="hsl(var(--border))"
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "hsl(var(--popover))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                        color: "hsl(var(--popover-foreground))",
                                        boxShadow:
                                          "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                      }}
                                      labelStyle={{
                                        color: "hsl(var(--popover-foreground))",
                                        fontWeight: 600,
                                        marginBottom: "4px",
                                      }}
                                      formatter={(value: number) => [
                                        value.toFixed(2),
                                        "Voto",
                                      ]}
                                      labelFormatter={(label, payload) => {
                                        if (payload && payload[0]) {
                                          const data = payload[0].payload;
                                          return `${data.movie}\n${data.round}`;
                                        }
                                        return label;
                                      }}
                                    />
                                    <defs>
                                      <linearGradient
                                        id="colorRating"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="5%"
                                          stopColor="hsl(var(--primary))"
                                          stopOpacity={0.8}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor="hsl(var(--primary))"
                                          stopOpacity={0.1}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <Area
                                      type="monotone"
                                      dataKey="rating"
                                      stroke="hsl(var(--primary))"
                                      strokeWidth={3}
                                      fill="url(#colorRating)"
                                      dot={{
                                        fill: "hsl(var(--primary))",
                                        stroke: "hsl(var(--background))",
                                        strokeWidth: 2,
                                        r: 6,
                                      }}
                                      activeDot={{
                                        r: 8,
                                        fill: "hsl(var(--primary))",
                                        stroke: "hsl(var(--background))",
                                        strokeWidth: 2,
                                      }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Average ratings summary */}
                        <div className="pt-4 border-t border-border">
                          <h4 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                            Medie per Sito
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
                className="cine-card overflow-hidden animate-fade-in-up"
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
                          Utente
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Media
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Film
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Vittorie
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

        {/* Empty State */}
        {!loading && displayedRankings.length === 0 && (
          <div className="cine-card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery
                ? "Nessun risultato"
                : "Nessun utente nella classifica"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? `Nessun utente corrisponde a "${searchQuery}"`
                : "Gli utenti appariranno qui dopo aver espresso i loro voti."}
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
