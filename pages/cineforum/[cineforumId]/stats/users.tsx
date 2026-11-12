import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";
import type { SupportedLocale } from "@/lib/server/get-locale";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { BarChart3 } from "lucide-react";
import {
  fetchUserProfileStats,
  fetchRatingDistribution,
  fetchDeviantMovies,
  fetchUserRankedMovies,
} from "@/lib/client/cineforum";
import { useCineforumUserSelector } from "@/lib/client/hooks/useCineforumUserSelector";
import { useUserRadar } from "@/lib/client/hooks/useUserRadar";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import EmptyState from "@/components/cineforum/common/EmptyState";
import UserRankingTrendChart from "@/components/cineforum/rankings/UserRankingTrendChart";
import {
  ProfileStatsSkeleton,
  RatingDistributionSkeleton,
  DeviantMoviesSkeleton,
  UserRankedMoviesSkeleton,
} from "@/components/cineforum/stats/UserStatsSkeleton";
import RatingDistributionChart from "@/components/cineforum/stats/RatingDistributionChart";
import DeviantMoviesTable from "@/components/cineforum/stats/DeviantMoviesTable";
import VotingProfileCard from "@/components/cineforum/stats/VotingProfileCard";
import UserRankedMoviesTable from "@/components/cineforum/stats/UserRankedMoviesTable";
import UserSelectorPanel from "@/components/cineforum/stats/UserSelectorPanel";
import { UserRadarSection } from "@/components/cineforum/stats/radar";
import type {
  UserProfileStatsDTO,
  RatingDistributionDTO,
  UserVoteDetailDTO,
  UserRankedMovieDTO,
} from "@/lib/shared/types";

type Props = {
  cineforumId: string;
  cineforumName: string;
  initialLocale: SupportedLocale;
};

export default function UserStatsPage({
  cineforumId,
  cineforumName,
  initialLocale: _initialLocale,
}: Props) {
  const { t } = useTranslation("stats");
  const { users, selectedUserId, setSelectedUserId, loading } =
    useCineforumUserSelector(cineforumId);
  const { radar, loading: radarLoading } = useUserRadar(cineforumId);

  const [profileStats, setProfileStats] = useState<UserProfileStatsDTO | null>(
    null,
  );
  const [ratingDistribution, setRatingDistribution] = useState<
    RatingDistributionDTO[]
  >([]);
  const [deviantMovies, setDeviantMovies] = useState<UserVoteDetailDTO[]>([]);
  const [rankedMovies, setRankedMovies] = useState<UserRankedMovieDTO[]>([]);

  const [profileLoading, setProfileLoading] = useState(false);
  const [distributionLoading, setDistributionLoading] = useState(false);
  const [deviantLoading, setDeviantLoading] = useState(false);
  const [rankedMoviesLoading, setRankedMoviesLoading] = useState(false);

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

  useEffect(() => {
    if (!selectedUserId) return;

    const loadRankedMovies = async () => {
      try {
        setRankedMoviesLoading(true);
        const response = await fetchUserRankedMovies(
          cineforumId,
          selectedUserId,
        );
        setRankedMovies(response.body);
      } catch (error) {
        console.error("Error loading ranked movies:", error);
        setRankedMovies([]);
      } finally {
        setRankedMoviesLoading(false);
      }
    };

    loadRankedMovies();
  }, [cineforumId, selectedUserId]);

  const selectedUserRanking = useMemo(() => {
    return users.find((u) => u.user_id === selectedUserId);
  }, [users, selectedUserId]);

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-100">
          <LoadingCard text={t("users.loading")} />
        </div>
      </CineforumLayout>
    );
  }

  if (users.length === 0) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="py-6 sm:py-8">
          <EmptyState
            title={t("users.emptyTitle")}
            subtitle={t("users.emptySubtitle")}
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
              {t("users.pageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("users.pageSubtitle")}
          </p>
        </div>

        <UserSelectorPanel
          users={users}
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
        />

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

        {/* PES-style hexagons */}
        {radarLoading ? (
          <div className="mb-8">
            <LoadingCard text={t("users.loading")} />
          </div>
        ) : radar && selectedUserId ? (
          <UserRadarSection
            radar={radar}
            selectedUserId={selectedUserId}
          />
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

        {/* All Ranked Movies Section */}
        {rankedMoviesLoading ? (
          <UserRankedMoviesSkeleton />
        ) : rankedMovies.length > 0 && selectedUserRanking ? (
          <UserRankedMoviesTable
            movies={rankedMovies}
            userName={selectedUserRanking.user}
          />
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
