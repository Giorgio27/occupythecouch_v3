import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { BarChart3 } from "lucide-react";
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
import {
  ProfileStatsSkeleton,
  LoveReceivedSkeleton,
  LoveGivenSkeleton,
  RatingDistributionSkeleton,
  DeviantMoviesSkeleton,
} from "@/components/cineforum/stats/UserStatsSkeleton";
import RatingDistributionChart from "@/components/cineforum/stats/RatingDistributionChart";
import DeviantMoviesTable from "@/components/cineforum/stats/DeviantMoviesTable";
import VotingProfileCard from "@/components/cineforum/stats/VotingProfileCard";
import LoveReceivedTable from "@/components/cineforum/stats/LoveReceivedTable";
import LoveGivenTable from "@/components/cineforum/stats/LoveGivenTable";
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
          <VotingProfileCard
            profileStats={profileStats}
            users={users}
            selectedUserId={selectedUserId!}
          />
        ) : null}

        {/* Love Received Section */}
        {loveReceivedLoading ? (
          <LoveReceivedSkeleton />
        ) : loveReceived.length > 0 && profileStats ? (
          <LoveReceivedTable
            loveReceived={loveReceived}
            profileStats={profileStats}
            users={users}
            selectedUserId={selectedUserId!}
          />
        ) : null}

        {/* Love Given Section */}
        {loveGivenLoading ? (
          <LoveGivenSkeleton />
        ) : loveGiven.length > 0 && profileStats ? (
          <LoveGivenTable loveGiven={loveGiven} profileStats={profileStats} />
        ) : null}

        {/* Rating Distribution Section */}
        {distributionLoading ? (
          <RatingDistributionSkeleton />
        ) : ratingDistribution.length > 0 ? (
          <RatingDistributionChart data={ratingDistribution} />
        ) : null}

        {/* Most Deviant Movies Section */}
        {deviantLoading ? (
          <DeviantMoviesSkeleton />
        ) : deviantMovies.length > 0 ? (
          <DeviantMoviesTable movies={deviantMovies} />
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
