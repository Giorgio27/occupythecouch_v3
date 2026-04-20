import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Award,
  Users,
  Percent,
  AlertCircle,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Heart,
  Gift,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  fetchUserRankings,
  fetchUserProfileStats,
  fetchLoveReceived,
  fetchLoveGiven,
  fetchRatingDistribution,
  fetchDeviantMovies,
} from "@/lib/client/cineforum";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import EmptyState from "@/components/cineforum/common/EmptyState";
import UserRankingTrendChart from "@/components/cineforum/rankings/UserRankingTrendChart";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ProfileStatsSkeleton,
  LoveReceivedSkeleton,
  LoveGivenSkeleton,
  RatingDistributionSkeleton,
  DeviantMoviesSkeleton,
} from "@/components/cineforum/stats/UserStatsSkeleton";
import type {
  UserRankingDTO,
  UserProfileStatsDTO,
  RatingDistributionDTO,
  LoveReceivedDTO,
  LoveGivenDTO,
  UserVoteDetailDTO,
} from "@/lib/shared/types";

type Props = {
  cineforumId: string;
  cineforumName: string;
};

type DistributionTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: RatingDistributionDTO;
  }>;
};

const DistributionTooltip = ({ active, payload }: DistributionTooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div
      className="rounded-xl p-3"
      style={{
        backgroundColor: "var(--popover)",
        border: "1px solid var(--border)",
        color: "var(--popover-foreground)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="text-xs text-muted-foreground mb-1">Voto</div>
      <div className="text-lg font-bold text-primary mb-2">
        {data.rating.toFixed(1)}
      </div>
      <div className="text-sm text-foreground">
        <span className="font-semibold">{data.count}</span>{" "}
        {data.count === 1
          ? "film votato con questo voto"
          : "film votati con questo voto"}
      </div>
    </div>
  );
};

export default function UserStatsPage({ cineforumId, cineforumName }: Props) {
  const [users, setUsers] = useState<UserRankingDTO[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Separate state for each section
  const [profileStats, setProfileStats] = useState<UserProfileStatsDTO | null>(
    null,
  );
  const [loveReceived, setLoveReceived] = useState<LoveReceivedDTO[]>([]);
  const [loveGiven, setLoveGiven] = useState<LoveGivenDTO[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<
    RatingDistributionDTO[]
  >([]);
  const [deviantMovies, setDeviantMovies] = useState<UserVoteDetailDTO[]>([]);

  // Separate loading states
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loveReceivedLoading, setLoveReceivedLoading] = useState(false);
  const [loveGivenLoading, setLoveGivenLoading] = useState(false);
  const [distributionLoading, setDistributionLoading] = useState(false);
  const [deviantLoading, setDeviantLoading] = useState(false);

  // Sorting state for love received table
  const [receivedSortBy, setReceivedSortBy] = useState<
    "user" | "average" | "delta"
  >("average");
  const [receivedSortDir, setReceivedSortDir] = useState<"asc" | "desc">(
    "desc",
  );

  // Expanded rows state for love received table
  const [expandedReceivedRows, setExpandedReceivedRows] = useState<Set<string>>(
    new Set(),
  );

  // Sorting state for expanded movie details
  const [expandedSortBy, setExpandedSortBy] = useState<
    Record<string, "round" | "movie" | "rating" | "average" | "delta">
  >({});
  const [expandedSortDir, setExpandedSortDir] = useState<
    Record<string, "asc" | "desc">
  >({});

  // Sorting state for love given table
  const [givenSortBy, setGivenSortBy] = useState<
    "user" | "average" | "averageRanking" | "delta"
  >("average");
  const [givenSortDir, setGivenSortDir] = useState<"asc" | "desc">("desc");

  // Expanded rows state for love given table
  const [expandedGivenRows, setExpandedGivenRows] = useState<Set<string>>(
    new Set(),
  );

  // Sorting state for expanded movie details in love given
  const [expandedGivenSortBy, setExpandedGivenSortBy] = useState<
    Record<string, "round" | "movie" | "rating" | "average" | "delta">
  >({});
  const [expandedGivenSortDir, setExpandedGivenSortDir] = useState<
    Record<string, "asc" | "desc">
  >({});

  // Load users list
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await fetchUserRankings(cineforumId, {
          offset: 0,
          limit: 100,
        });
        setUsers(response.body);

        // Auto-select first user
        if (response.body.length > 0 && !selectedUserId) {
          setSelectedUserId(response.body[0].user_id);
        }
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [cineforumId]);

  // Load profile stats for selected user
  useEffect(() => {
    if (!selectedUserId) return;

    const loadProfileStats = async () => {
      try {
        setProfileLoading(true);
        const response = await fetchUserProfileStats(
          cineforumId,
          selectedUserId,
        );
        setProfileStats(response.body);
      } catch (error) {
        console.error("Error loading profile stats:", error);
        setProfileStats(null);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileStats();
  }, [cineforumId, selectedUserId]);

  // Load love received for selected user
  useEffect(() => {
    if (!selectedUserId) return;

    const loadLoveReceived = async () => {
      try {
        setLoveReceivedLoading(true);
        const response = await fetchLoveReceived(cineforumId, selectedUserId);
        setLoveReceived(response.body);
      } catch (error) {
        console.error("Error loading love received:", error);
        setLoveReceived([]);
      } finally {
        setLoveReceivedLoading(false);
      }
    };

    loadLoveReceived();
  }, [cineforumId, selectedUserId]);

  // Load love given for selected user
  useEffect(() => {
    if (!selectedUserId) return;

    const loadLoveGiven = async () => {
      try {
        setLoveGivenLoading(true);
        const response = await fetchLoveGiven(cineforumId, selectedUserId);
        setLoveGiven(response.body);
      } catch (error) {
        console.error("Error loading love given:", error);
        setLoveGiven([]);
      } finally {
        setLoveGivenLoading(false);
      }
    };

    loadLoveGiven();
  }, [cineforumId, selectedUserId]);

  // Load rating distribution for selected user
  useEffect(() => {
    if (!selectedUserId) return;

    const loadRatingDistribution = async () => {
      try {
        setDistributionLoading(true);
        const response = await fetchRatingDistribution(
          cineforumId,
          selectedUserId,
        );
        setRatingDistribution(response.body);
      } catch (error) {
        console.error("Error loading rating distribution:", error);
        setRatingDistribution([]);
      } finally {
        setDistributionLoading(false);
      }
    };

    loadRatingDistribution();
  }, [cineforumId, selectedUserId]);

  // Load deviant movies for selected user
  useEffect(() => {
    if (!selectedUserId) return;

    const loadDeviantMovies = async () => {
      try {
        setDeviantLoading(true);
        const response = await fetchDeviantMovies(cineforumId, selectedUserId);
        setDeviantMovies(response.body);
      } catch (error) {
        console.error("Error loading deviant movies:", error);
        setDeviantMovies([]);
      } finally {
        setDeviantLoading(false);
      }
    };

    loadDeviantMovies();
  }, [cineforumId, selectedUserId]);

  const selectedUserRanking = useMemo(() => {
    return users.find((u) => u.user_id === selectedUserId);
  }, [users, selectedUserId]);

  // Determine user tendency (create at least 6 categories to avoid having too many "equilibrato")
  const userTendency = useMemo(() => {
    if (!profileStats || profileStats.delta_from_global === null) return null;

    const delta = profileStats.delta_from_global;
    if (delta > 1.0)
      return {
        label: "Molto Generoso",
        color: "text-green-700",
        icon: TrendingUp,
      };
    if (delta > 0.5)
      return { label: "Generoso", color: "text-green-500", icon: TrendingUp };
    if (delta > 0.1)
      return {
        label: "Leggermente Generoso",
        color: "text-green-300",
        icon: TrendingUp,
      };
    if (delta < -0.1)
      return {
        label: "Leggermente Severo",
        color: "text-red-300",
        icon: TrendingDown,
      };
    if (delta < -0.5)
      return { label: "Severo", color: "text-red-500", icon: TrendingDown };
    if (delta < -1.0)
      return {
        label: "Molto Severo",
        color: "text-red-700",
        icon: TrendingDown,
      };
    return { label: "Equilibrato", color: "text-blue-500", icon: Target };
  }, [profileStats]);

  // Determine consistency
  const consistencyLevel = useMemo(() => {
    if (!profileStats || profileStats.standard_deviation === null) return null;

    const sd = profileStats.standard_deviation;
    if (sd < 0.5)
      return {
        label: "Molto Coerente",
        color: "bg-green-500/10 text-green-500 border-green-500/30",
      };
    if (sd < 1.0)
      return {
        label: "Coerente",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      };
    if (sd < 1.5)
      return {
        label: "Variabile",
        color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      };
    return {
      label: "Molto Variabile",
      color: "bg-red-500/10 text-red-500 border-red-500/30",
    };
  }, [profileStats]);

  // Prepare love received data (how others voted for user X's movies)
  const loveReceivedData = useMemo(() => {
    if (!profileStats) return [];

    return loveReceived.map((lr) => ({
      user: lr.userName,
      userId: lr.userId,
      average: lr.averageVote,
      count: lr.count,
      votes: lr.votes,
      isSelectedUser: lr.userId === profileStats.user_id,
    }));
  }, [loveReceived, profileStats]);

  // Prepare love given data (how user X voted for others' movies)
  const loveGivenData = useMemo(() => {
    if (!profileStats) return [];

    return loveGiven.map((lg) => ({
      user: lg.userName,
      userId: lg.userId,
      average: lg.averageVote,
      averageRanking: lg.averageRanking,
      count: lg.count,
      votes: lg.votes,
      isSelectedUser: lg.userId === profileStats.user_id,
    }));
  }, [loveGiven, profileStats]);

  // Sort love received
  const sortedLoveReceived = useMemo(() => {
    const selectedUser = users.find((u) => u.user_id === selectedUserId);
    const sorted = [...loveReceivedData];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (receivedSortBy === "user") {
        comparison = a.user.localeCompare(b.user);
      } else if (receivedSortBy === "average") {
        comparison = a.average - b.average;
      } else if (receivedSortBy === "delta") {
        const baseAvg = selectedUser?.average_rating ?? 0;
        const deltaA = a.average - baseAvg;
        const deltaB = b.average - baseAvg;
        comparison = deltaA - deltaB;
      }
      return receivedSortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [
    loveReceivedData,
    receivedSortBy,
    receivedSortDir,
    users,
    selectedUserId,
  ]);

  // Sort love given
  const sortedLoveGiven = useMemo(() => {
    const sorted = [...loveGivenData];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (givenSortBy === "user") {
        comparison = a.user.localeCompare(b.user);
      } else if (givenSortBy === "average") {
        comparison = a.average - b.average;
      } else if (givenSortBy === "averageRanking") {
        const avgA = a.averageRanking ?? 0;
        const avgB = b.averageRanking ?? 0;
        comparison = avgA - avgB;
      } else if (givenSortBy === "delta") {
        const deltaA = a.average - (a.averageRanking ?? 0);
        const deltaB = b.average - (b.averageRanking ?? 0);
        comparison = deltaA - deltaB;
      }
      return givenSortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [loveGivenData, givenSortBy, givenSortDir]);

  // Toggle sort handlers
  const toggleReceivedSort = useCallback(
    (column: "user" | "average" | "delta") => {
      if (receivedSortBy === column) {
        setReceivedSortDir(receivedSortDir === "asc" ? "desc" : "asc");
      } else {
        setReceivedSortBy(column);
        setReceivedSortDir("desc");
      }
    },
    [receivedSortBy, receivedSortDir],
  );

  const toggleGivenSort = useCallback(
    (column: "user" | "average" | "averageRanking" | "delta") => {
      if (givenSortBy === column) {
        setGivenSortDir(givenSortDir === "asc" ? "desc" : "asc");
      } else {
        setGivenSortBy(column);
        setGivenSortDir("desc");
      }
    },
    [givenSortBy, givenSortDir],
  );

  // Toggle expanded row for love given
  const toggleExpandedGivenRow = useCallback((userId: string) => {
    setExpandedGivenRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // Toggle sort for expanded movie details in love given
  const toggleExpandedGivenSort = useCallback(
    (
      userId: string,
      column: "round" | "movie" | "rating" | "average" | "delta",
    ) => {
      setExpandedGivenSortBy((prev) => {
        const currentSort = prev[userId] || "rating";
        return { ...prev, [userId]: column };
      });
      setExpandedGivenSortDir((prev) => {
        const currentSort = expandedGivenSortBy[userId] || "rating";
        const currentDir = prev[userId] || "desc";
        if (currentSort === column) {
          return { ...prev, [userId]: currentDir === "asc" ? "desc" : "asc" };
        } else {
          return { ...prev, [userId]: "desc" };
        }
      });
    },
    [expandedGivenSortBy],
  );

  // Sort votes for a specific user in love given
  const getSortedGivenVotes = useCallback(
    (votes: LoveGivenDTO["votes"], userId: string) => {
      const sortBy = expandedGivenSortBy[userId] || "rating";
      const sortDir = expandedGivenSortDir[userId] || "desc";

      const sorted = [...votes];
      sorted.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "round") {
          comparison = a.round.localeCompare(b.round);
        } else if (sortBy === "movie") {
          comparison = a.movieTitle.localeCompare(b.movieTitle);
        } else if (sortBy === "rating") {
          comparison = a.rating - b.rating;
        } else if (sortBy === "average") {
          comparison = a.movieAverageVote - b.movieAverageVote;
        } else if (sortBy === "delta") {
          const deltaA = a.rating - a.movieAverageVote;
          const deltaB = b.rating - b.movieAverageVote;
          comparison = deltaA - deltaB;
        }
        return sortDir === "asc" ? comparison : -comparison;
      });
      return sorted;
    },
    [expandedGivenSortBy, expandedGivenSortDir],
  );

  // Render sort icon for expanded tables in love given
  const renderExpandedGivenSortIcon = (
    userId: string,
    column: "round" | "movie" | "rating" | "average" | "delta",
  ) => {
    const currentSort = expandedGivenSortBy[userId] || "rating";
    const currentDir = expandedGivenSortDir[userId] || "desc";

    if (column !== currentSort) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    }
    return currentDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  // Render sort icon
  const renderSortIcon = (
    column: string,
    currentSort: string,
    currentDir: "asc" | "desc",
  ) => {
    if (column !== currentSort) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    }
    return currentDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1" />
    );
  };

  // Toggle expanded row
  const toggleExpandedRow = useCallback((userId: string) => {
    setExpandedReceivedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // Toggle sort for expanded movie details
  const toggleExpandedSort = useCallback(
    (
      userId: string,
      column: "round" | "movie" | "rating" | "average" | "delta",
    ) => {
      setExpandedSortBy((prev) => {
        const currentSort = prev[userId] || "rating";
        return { ...prev, [userId]: column };
      });
      setExpandedSortDir((prev) => {
        const currentSort = expandedSortBy[userId] || "rating";
        const currentDir = prev[userId] || "desc";
        if (currentSort === column) {
          return { ...prev, [userId]: currentDir === "asc" ? "desc" : "asc" };
        } else {
          return { ...prev, [userId]: "desc" };
        }
      });
    },
    [expandedSortBy],
  );

  // Sort votes for a specific user
  const getSortedVotes = useCallback(
    (votes: LoveReceivedDTO["votes"], userId: string) => {
      const sortBy = expandedSortBy[userId] || "rating";
      const sortDir = expandedSortDir[userId] || "desc";

      const sorted = [...votes];
      sorted.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "round") {
          comparison = a.round.localeCompare(b.round);
        } else if (sortBy === "movie") {
          comparison = a.movieTitle.localeCompare(b.movieTitle);
        } else if (sortBy === "rating") {
          comparison = a.rating - b.rating;
        } else if (sortBy === "average") {
          comparison = a.movieAverageVote - b.movieAverageVote;
        } else if (sortBy === "delta") {
          const deltaA = a.rating - a.movieAverageVote;
          const deltaB = b.rating - b.movieAverageVote;
          comparison = deltaA - deltaB;
        }
        return sortDir === "asc" ? comparison : -comparison;
      });
      return sorted;
    },
    [expandedSortBy, expandedSortDir],
  );

  // Render sort icon for expanded tables
  const renderExpandedSortIcon = (
    userId: string,
    column: "round" | "movie" | "rating" | "average" | "delta",
  ) => {
    const currentSort = expandedSortBy[userId] || "rating";
    const currentDir = expandedSortDir[userId] || "desc";

    if (column !== currentSort) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    }
    return currentDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-100">
          <LoadingCard text="Caricamento statistiche..." />
        </div>
      </CineforumLayout>
    );
  }

  if (users.length === 0) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="py-6 sm:py-8">
          <EmptyState
            title="Nessun utente trovato"
            subtitle="Non ci sono ancora utenti con voti in questo cineforum"
          />
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
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Statistiche Utenti
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Analisi comportamentale dei voti e tendenze individuali
          </p>
        </div>

        {/* User Selector */}
        <div
          className="mb-6 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Seleziona Utente
          </label>
          <select
            value={selectedUserId || ""}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full sm:w-auto min-w-70 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
              hover:border-primary/50 transition-all duration-200"
          >
            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.user}{" "}
                {user.average_rating !== null
                  ? `(${user.average_rating.toFixed(2)})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Profile Stats Section */}
        {profileLoading ? (
          <ProfileStatsSkeleton />
        ) : profileStats ? (
          <TooltipProvider>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cine-card p-4 flex items-center gap-3 cursor-help">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Media Utente
                        <Info className="w-3 h-3" />
                      </p>
                      <p className="text-lg font-bold text-foreground tabular-nums">
                        {profileStats.average_rating !== null
                          ? profileStats.average_rating.toFixed(2)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    La media di tutti i voti espressi da questo utente nel
                    cineforum. Indica la tendenza generale dell'utente a votare
                    alto o basso.
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cine-card p-4 flex items-center gap-3 cursor-help">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Media Globale
                        <Info className="w-3 h-3" />
                      </p>
                      <p className="text-lg font-bold text-foreground tabular-nums">
                        {profileStats.global_average !== null
                          ? profileStats.global_average.toFixed(2)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    La media di tutti i voti espressi da tutti gli utenti del
                    cineforum. Rappresenta il "consenso generale" del gruppo.
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cine-card p-4 flex items-center gap-3 cursor-help">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Target className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Delta
                        <Info className="w-3 h-3" />
                      </p>
                      <p
                        className={`text-lg font-bold tabular-nums ${
                          profileStats.delta_from_global !== null
                            ? profileStats.delta_from_global > 0
                              ? "text-green-500"
                              : profileStats.delta_from_global < 0
                                ? "text-red-500"
                                : "text-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {profileStats.delta_from_global !== null
                          ? (profileStats.delta_from_global > 0 ? "+" : "") +
                            profileStats.delta_from_global.toFixed(2)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    La differenza tra la media dell'utente e la media globale.
                    <br />
                    <span className="text-green-500">Positivo</span>: l'utente
                    vota più alto della media (generoso).
                    <br />
                    <span className="text-red-500">Negativo</span>: l'utente
                    vota più basso della media (severo).
                  </p>
                </TooltipContent>
              </Tooltip>

              <div className="cine-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Film Votati</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {profileStats.total_votes}
                  </p>
                </div>
              </div>
            </div>

            {/* Tendency & Consistency Section */}
            <div className="cine-card p-6 mb-8">
              <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Profilo Votante
              </h3>

              <div className="space-y-4">
                {/* Explanation text */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Questo profilo analizza il comportamento di voto dell'utente
                    rispetto al gruppo. La{" "}
                    <strong className="text-foreground">tendenza</strong> indica
                    se l'utente tende a votare più alto (generoso) o più basso
                    (severo) rispetto alla media globale. La{" "}
                    <strong className="text-foreground">coerenza</strong> misura
                    quanto sono variabili i voti: un utente coerente dà voti
                    simili tra loro, mentre uno variabile alterna voti molto
                    alti e molto bassi. L'
                    <strong className="text-foreground">
                      accordo con il consenso
                    </strong>{" "}
                    mostra quanto spesso l'utente vota sopra o sotto la media
                    del film.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Tendency */}
                  {userTendency && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30">
                      <div
                        className={`p-2 rounded-lg ${userTendency.color} bg-current/10`}
                      >
                        <userTendency.icon
                          className={`w-5 h-5 ${userTendency.color}`}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tendenza
                        </p>
                        <p
                          className={`text-sm font-bold ${userTendency.color}`}
                        >
                          {userTendency.label}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Consistency */}
                  {consistencyLevel && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Coerenza
                        </p>
                        <Badge className={`${consistencyLevel.color} border`}>
                          {consistencyLevel.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          σ ={" "}
                          {profileStats.standard_deviation?.toFixed(2) || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Consensus Agreement */}
                  {profileStats.above_consensus_percentage !== null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30 cursor-help">
                          <div className="p-2 rounded-lg bg-cyan-500/10">
                            <Percent className="w-5 h-5 text-cyan-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              Sopra Consenso
                              <Info className="w-3 h-3" />
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              {profileStats.above_consensus_percentage.toFixed(
                                1,
                              )}
                              %
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          La percentuale di volte in cui l'utente ha votato
                          sopra la media del film. Indica quanto spesso l'utente
                          è più generoso rispetto al consenso generale su
                          ciascun film.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {profileStats.average_deviation_from_consensus !== null && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-sm cursor-help">
                          <span className="text-muted-foreground flex items-center gap-1">
                            Deviazione media dal consenso:
                            <Info className="w-3 h-3" />
                          </span>
                          <span className="font-bold text-foreground tabular-nums">
                            {profileStats.average_deviation_from_consensus.toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          La media delle differenze assolute tra i voti
                          dell'utente e la media di ciascun film. Misura quanto
                          l'utente si discosta tipicamente dal consenso,
                          indipendentemente dalla direzione (sopra o sotto).
                          Valori più alti indicano opinioni più divergenti dal
                          gruppo.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          </TooltipProvider>
        ) : null}

        {/* Love Received Section */}
        {loveReceivedLoading ? (
          <LoveReceivedSkeleton />
        ) : sortedLoveReceived.length > 0 && profileStats ? (
          <div className="cine-card p-6 mb-8">
            <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Amore Ricevuto
            </h3>

            <div className="mb-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quanto gli altri utenti hanno votato in media i film votati da{" "}
                <strong className="text-foreground">
                  {profileStats.user_name}
                </strong>
                . La tabella mostra la media dei voti ricevuti da ciascun
                utente.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">
                      {/* Expand column */}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleReceivedSort("user")}
                    >
                      <div className="flex items-center">
                        Utente
                        {renderSortIcon(
                          "user",
                          receivedSortBy,
                          receivedSortDir,
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleReceivedSort("average")}
                    >
                      <div className="flex items-center justify-end">
                        Media Ricevuta
                        {renderSortIcon(
                          "average",
                          receivedSortBy,
                          receivedSortDir,
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleReceivedSort("delta")}
                    >
                      <div className="flex items-center justify-end">
                        Delta
                        {renderSortIcon(
                          "delta",
                          receivedSortBy,
                          receivedSortDir,
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLoveReceived.map((row) => {
                    const isExpanded = expandedReceivedRows.has(row.userId);
                    const selectedUser = users.find(
                      (u) => u.user_id === selectedUserId,
                    );
                    const delta = profileStats
                      ? row.average - (selectedUser.average_rating ?? 0)
                      : 0;
                    const sortedVotes = getSortedVotes(row.votes, row.userId);
                    return (
                      <Fragment key={row.userId}>
                        <tr
                          onClick={() => toggleExpandedRow(row.userId)}
                          className={`border-b border-border transition-colors cursor-pointer ${
                            row.isSelectedUser
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "hover:bg-secondary/50"
                          } ${isExpanded ? "border-b-0" : ""}`}
                        >
                          <td className="px-4 py-3.5 text-sm">
                            <div className="p-1">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                            {row.user}
                            {row.isSelectedUser && (
                              <span className="ml-2 text-xs text-primary font-semibold">
                                (utente selezionato)
                              </span>
                            )}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({row.count} film)
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums text-foreground">
                            {row.average.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums">
                            <span
                              className={
                                delta > 0
                                  ? "text-green-500"
                                  : delta < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                              }
                            >
                              {delta > 0 ? "+" : ""}
                              {delta.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-border">
                            <td
                              colSpan={4}
                              className="px-4 py-4 bg-secondary/30"
                            >
                              <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Voti per Film
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-border">
                                        <th
                                          className="px-3 py-2 text-left text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedSort(
                                              row.userId,
                                              "round",
                                            )
                                          }
                                        >
                                          <div className="flex items-center">
                                            Round
                                            {renderExpandedSortIcon(
                                              row.userId,
                                              "round",
                                            )}
                                          </div>
                                        </th>
                                        <th
                                          className="px-3 py-2 text-left text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedSort(
                                              row.userId,
                                              "movie",
                                            )
                                          }
                                        >
                                          <div className="flex items-center">
                                            Film
                                            {renderExpandedSortIcon(
                                              row.userId,
                                              "movie",
                                            )}
                                          </div>
                                        </th>
                                        <th
                                          className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedSort(
                                              row.userId,
                                              "rating",
                                            )
                                          }
                                        >
                                          <div className="flex items-center justify-end">
                                            Voto Dato
                                            {renderExpandedSortIcon(
                                              row.userId,
                                              "rating",
                                            )}
                                          </div>
                                        </th>
                                        <th
                                          className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedSort(
                                              row.userId,
                                              "average",
                                            )
                                          }
                                        >
                                          <div className="flex items-center justify-end">
                                            Media Film
                                            {renderExpandedSortIcon(
                                              row.userId,
                                              "average",
                                            )}
                                          </div>
                                        </th>
                                        <th
                                          className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedSort(
                                              row.userId,
                                              "delta",
                                            )
                                          }
                                        >
                                          <div className="flex items-center justify-end">
                                            Delta
                                            {renderExpandedSortIcon(
                                              row.userId,
                                              "delta",
                                            )}
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sortedVotes.map((vote, idx) => {
                                        const voteDelta =
                                          vote.rating - vote.movieAverageVote;
                                        return (
                                          <tr
                                            key={`${row.userId}-${vote.movieTitle}-${vote.round}-${idx}`}
                                            className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                                          >
                                            <td className="px-3 py-2 text-muted-foreground">
                                              {vote.round}
                                            </td>
                                            <td className="px-3 py-2 text-foreground">
                                              {vote.movieTitle}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-primary tabular-nums">
                                              {vote.rating.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                                              {vote.movieAverageVote.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold tabular-nums">
                                              <span
                                                className={
                                                  voteDelta > 0
                                                    ? "text-green-500"
                                                    : voteDelta < 0
                                                      ? "text-red-500"
                                                      : "text-muted-foreground"
                                                }
                                              >
                                                {voteDelta > 0 ? "+" : ""}
                                                {voteDelta.toFixed(2)}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Love Given Section */}
        {loveGivenLoading ? (
          <LoveGivenSkeleton />
        ) : sortedLoveGiven.length > 0 && profileStats ? (
          <div className="cine-card p-6 mb-8">
            <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Amore Dato
            </h3>

            <div className="mb-4 p-4 rounded-xl bg-secondary/30 border border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quanto{" "}
                <strong className="text-foreground">
                  {profileStats.user_name}
                </strong>{" "}
                ha votato in media i film proposti dagli altri utenti.
                <br />
                <strong className="text-foreground">Media Data</strong>: la
                media dei voti che {profileStats.user_name} ha dato ai film
                proposti dall'utente della riga.
                <br />
                <strong className="text-foreground">Media Ranking</strong>: la
                media globale dell'utente della riga nel cineforum (per
                confronto).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">
                      {/* Expand column */}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleGivenSort("user")}
                    >
                      <div className="flex items-center">
                        Utente
                        {renderSortIcon("user", givenSortBy, givenSortDir)}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleGivenSort("average")}
                    >
                      <div className="flex items-center justify-end">
                        Media Data
                        {renderSortIcon("average", givenSortBy, givenSortDir)}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleGivenSort("averageRanking")}
                    >
                      <div className="flex items-center justify-end">
                        Media Ranking
                        {renderSortIcon(
                          "averageRanking",
                          givenSortBy,
                          givenSortDir,
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleGivenSort("delta")}
                    >
                      <div className="flex items-center justify-end">
                        Delta
                        {renderSortIcon("delta", givenSortBy, givenSortDir)}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLoveGiven.map((row) => {
                    const isExpanded = expandedGivenRows.has(row.userId);
                    const delta = row.average - (row.averageRanking ?? 0);
                    const sortedVotes = getSortedGivenVotes(
                      row.votes,
                      row.userId,
                    );
                    return (
                      <Fragment key={row.userId}>
                        <tr
                          onClick={() => toggleExpandedGivenRow(row.userId)}
                          className={`border-b border-border transition-colors cursor-pointer ${
                            row.isSelectedUser
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "hover:bg-secondary/50"
                          } ${isExpanded ? "border-b-0" : ""}`}
                        >
                          <td className="px-4 py-3.5 text-sm">
                            <div className="p-1">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                            {row.user}
                            {row.isSelectedUser && (
                              <span className="ml-2 text-xs text-primary font-semibold">
                                (utente selezionato)
                              </span>
                            )}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({row.count} film)
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums text-foreground">
                            {row.average.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-right tabular-nums text-muted-foreground">
                            {row.averageRanking !== null
                              ? row.averageRanking.toFixed(2)
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums">
                            <span
                              className={
                                delta > 0
                                  ? "text-green-500"
                                  : delta < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                              }
                            >
                              {delta > 0 ? "+" : ""}
                              {delta.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-border">
                            <td
                              colSpan={5}
                              className="px-4 py-4 bg-secondary/30"
                            >
                              <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Voti Dati ai Film di {row.user}
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-border">
                                        <th
                                          className="px-3 py-2 text-left text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedGivenSort(
                                              row.userId,
                                              "round",
                                            )
                                          }
                                        >
                                          <div className="flex items-center">
                                            Round
                                            {renderExpandedGivenSortIcon(
                                              row.userId,
                                              "round",
                                            )}
                                          </div>
                                        </th>
                                        <th
                                          className="px-3 py-2 text-left text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedGivenSort(
                                              row.userId,
                                              "movie",
                                            )
                                          }
                                        >
                                          <div className="flex items-center">
                                            Film
                                            {renderExpandedGivenSortIcon(
                                              row.userId,
                                              "movie",
                                            )}
                                          </div>
                                        </th>
                                        <th
                                          className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedGivenSort(
                                              row.userId,
                                              "rating",
                                            )
                                          }
                                        >
                                          <div className="flex items-center justify-end">
                                            Voto Dato
                                            {renderExpandedGivenSortIcon(
                                              row.userId,
                                              "rating",
                                            )}
                                          </div>
                                        </th>
                                        <th
                                          className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedGivenSort(
                                              row.userId,
                                              "average",
                                            )
                                          }
                                        >
                                          <div className="flex items-center justify-end">
                                            Media Film
                                            {renderExpandedGivenSortIcon(
                                              row.userId,
                                              "average",
                                            )}
                                          </div>
                                        </th>
                                        <th
                                          className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                          onClick={() =>
                                            toggleExpandedGivenSort(
                                              row.userId,
                                              "delta",
                                            )
                                          }
                                        >
                                          <div className="flex items-center justify-end">
                                            Delta
                                            {renderExpandedGivenSortIcon(
                                              row.userId,
                                              "delta",
                                            )}
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sortedVotes.map((vote, idx) => {
                                        const voteDelta =
                                          vote.rating - vote.movieAverageVote;
                                        return (
                                          <tr
                                            key={`${row.userId}-${vote.movieTitle}-${vote.round}-${idx}`}
                                            className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                                          >
                                            <td className="px-3 py-2 text-muted-foreground">
                                              {vote.round}
                                            </td>
                                            <td className="px-3 py-2 text-foreground">
                                              {vote.movieTitle}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-primary tabular-nums">
                                              {vote.rating.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                                              {vote.movieAverageVote.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold tabular-nums">
                                              <span
                                                className={
                                                  voteDelta > 0
                                                    ? "text-green-500"
                                                    : voteDelta < 0
                                                      ? "text-red-500"
                                                      : "text-muted-foreground"
                                                }
                                              >
                                                {voteDelta > 0 ? "+" : ""}
                                                {voteDelta.toFixed(2)}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Rating Distribution Section */}
        {distributionLoading ? (
          <RatingDistributionSkeleton />
        ) : ratingDistribution.length > 0 ? (
          <div className="cine-card p-6 mb-8">
            <h3 className="font-bold text-primary mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Distribuzione Voti
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Quanti film hai votato con ciascun voto
            </p>

            <div className="h-75 sm:h-87.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ratingDistribution}
                  margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="rating"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    content={<DistributionTooltip />}
                    cursor={{ fill: "var(--secondary)" }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {ratingDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="var(--primary)"
                        opacity={0.7 + (entry.rating / 5) * 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Most Deviant Movies Section */}
        {deviantLoading ? (
          <DeviantMoviesSkeleton />
        ) : deviantMovies.length > 0 ? (
          <div className="cine-card p-6 mb-8">
            <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Film con Maggiore Divergenza
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Film
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Round
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tuo Voto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Media Film
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Differenza
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deviantMovies.map((movie, index) => (
                    <tr
                      key={index}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                        {movie.movie}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {movie.round}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums text-primary">
                        {movie.user_rating.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right tabular-nums text-muted-foreground">
                        {movie.movie_average.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums">
                        <span
                          className={
                            movie.user_rating > movie.movie_average
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {movie.user_rating > movie.movie_average ? "+" : ""}
                          {(movie.user_rating - movie.movie_average).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Trend Chart */}
        {selectedUserRanking && (
          <div>
            <UserRankingTrendChart ranking={selectedUserRanking} />
          </div>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
