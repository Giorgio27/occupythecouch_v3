import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import type { SupportedLocale } from "@/lib/server/get-locale";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Heart } from "lucide-react";
import {
  fetchUserProfileStats,
  fetchLoveReceived,
  fetchLoveGiven,
  fetchSimilarUsers,
} from "@/lib/client/cineforum";
import { useCineforumUserSelector } from "@/lib/client/hooks/useCineforumUserSelector";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import EmptyState from "@/components/cineforum/common/EmptyState";
import {
  LoveReceivedSkeleton,
  LoveGivenSkeleton,
  SimilarUsersSkeleton,
} from "@/components/cineforum/stats/UserStatsSkeleton";
import LoveReceivedTable from "@/components/cineforum/stats/LoveReceivedTable";
import LoveGivenTable from "@/components/cineforum/stats/LoveGivenTable";
import SimilarUsersTable from "@/components/cineforum/stats/SimilarUsersTable";
import UserSelectorPanel from "@/components/cineforum/stats/UserSelectorPanel";
import type {
  UserProfileStatsDTO,
  LoveReceivedDTO,
  LoveGivenDTO,
  SimilarUserDTO,
} from "@/lib/shared/types";

type Props = {
  cineforumId: string;
  cineforumName: string;
  initialLocale: SupportedLocale;
};

export default function UserAffinityPage({
  cineforumId,
  cineforumName,
  initialLocale: _initialLocale,
}: Props) {
  const { t } = useTranslation("stats");
  const { users, selectedUserId, setSelectedUserId, loading } =
    useCineforumUserSelector(cineforumId);

  const [profileStats, setProfileStats] = useState<UserProfileStatsDTO | null>(
    null,
  );
  const [loveReceived, setLoveReceived] = useState<LoveReceivedDTO[]>([]);
  const [loveGiven, setLoveGiven] = useState<LoveGivenDTO[]>([]);
  const [similarUsers, setSimilarUsers] = useState<SimilarUserDTO[]>([]);

  const [profileLoading, setProfileLoading] = useState(false);
  const [loveReceivedLoading, setLoveReceivedLoading] = useState(false);
  const [loveGivenLoading, setLoveGivenLoading] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);

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

  useEffect(() => {
    if (!selectedUserId) return;

    const loadSimilarUsers = async () => {
      try {
        setSimilarLoading(true);
        const response = await fetchSimilarUsers(cineforumId, selectedUserId);
        setSimilarUsers(response.body);
      } catch (error) {
        console.error("Error loading similar users:", error);
        setSimilarUsers([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    loadSimilarUsers();
  }, [cineforumId, selectedUserId]);

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
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("users.affinityPageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("users.affinityPageSubtitle")}
          </p>
        </div>

        <UserSelectorPanel
          users={users}
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
        />

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
        {loveGivenLoading || profileLoading ? (
          <LoveGivenSkeleton />
        ) : loveGiven.length > 0 && profileStats ? (
          <LoveGivenTable loveGiven={loveGiven} profileStats={profileStats} />
        ) : null}

        {/* Similar Users Section */}
        {similarLoading ? (
          <SimilarUsersSkeleton />
        ) : selectedUserId ? (
          <SimilarUsersTable
            similarUsers={similarUsers}
            cineforumId={cineforumId}
            targetUserId={selectedUserId}
            targetUserName={
              users.find((u) => u.user_id === selectedUserId)?.user ?? ""
            }
          />
        ) : null}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
