import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Users,
  Activity,
  AlertCircle,
  Info,
  Percent,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { StatCard, SectionHeader } from "@/components/cineforum/common";
import type { UserProfileStatsDTO, UserRankingDTO } from "@/lib/shared/types";

type Props = {
  profileStats: UserProfileStatsDTO;
  users: UserRankingDTO[];
  selectedUserId: string;
};

export default function VotingProfileCard({
  profileStats,
  users,
  selectedUserId,
}: Props) {
  const { t } = useTranslation("stats");

  // Determine user tendency
  const userTendency = useMemo(() => {
    if (profileStats.delta_from_global === null) return null;

    const delta = profileStats.delta_from_global;
    if (delta > 1.0)
      return {
        label: t("users.tendencyVeryGenerous"),
        color: "text-green-700",
        icon: TrendingUp,
      };
    if (delta > 0.5)
      return {
        label: t("users.tendencyGenerous"),
        color: "text-green-500",
        icon: TrendingUp,
      };
    if (delta > 0.1)
      return {
        label: t("users.tendencySlightlyGenerous"),
        color: "text-green-300",
        icon: TrendingUp,
      };
    if (delta < -0.1)
      return {
        label: t("users.tendencySlightlyStrict"),
        color: "text-red-300",
        icon: TrendingDown,
      };
    if (delta < -0.5)
      return {
        label: t("users.tendencyStrict"),
        color: "text-red-500",
        icon: TrendingDown,
      };
    if (delta < -1.0)
      return {
        label: t("users.tendencyVeryStrict"),
        color: "text-red-700",
        icon: TrendingDown,
      };
    return {
      label: t("users.tendencyBalanced"),
      color: "text-blue-500",
      icon: Target,
    };
  }, [profileStats, t]);

  // Determine consistency
  const consistencyLevel = useMemo(() => {
    if (profileStats.standard_deviation === null) return null;

    const sd = profileStats.standard_deviation;
    if (sd < 0.5)
      return {
        label: t("users.consistencyVeryConsistent"),
        color: "bg-green-500/10 text-green-500 border-green-500/30",
      };
    if (sd < 1.0)
      return {
        label: t("users.consistencyConsistent"),
        color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      };
    if (sd < 1.5)
      return {
        label: t("users.consistencyVariable"),
        color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      };
    return {
      label: t("users.consistencyVeryVariable"),
      color: "bg-red-500/10 text-red-500 border-red-500/30",
    };
  }, [profileStats, t]);

  // Delta value formatting
  const deltaValue =
    profileStats.delta_from_global !== null
      ? (profileStats.delta_from_global > 0 ? "+" : "") +
        profileStats.delta_from_global.toFixed(2)
      : null;

  const deltaClassName =
    profileStats.delta_from_global !== null
      ? profileStats.delta_from_global > 0
        ? "text-green-500"
        : profileStats.delta_from_global < 0
          ? "text-red-500"
          : "text-foreground"
      : undefined;

  return (
    <TooltipProvider>
      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          icon={<Award className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/10"
          label={t("users.userAverage")}
          value={
            profileStats.average_rating !== null
              ? profileStats.average_rating.toFixed(2)
              : null
          }
          tooltip={t("users.userAverageTooltip")}
        />

        <StatCard
          icon={<Users className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-500/10"
          label={t("users.globalAverage")}
          value={
            profileStats.global_average !== null
              ? profileStats.global_average.toFixed(2)
              : null
          }
          tooltip={t("users.globalAverageTooltip")}
        />

        <StatCard
          icon={<Target className="w-5 h-5 text-amber-500" />}
          iconBg="bg-amber-500/10"
          label={t("users.delta")}
          value={deltaValue}
          valueClassName={deltaClassName}
          tooltip={t("users.deltaTooltip")}
        />

        <StatCard
          icon={<Activity className="w-5 h-5 text-purple-500" />}
          iconBg="bg-purple-500/10"
          label={t("users.moviesVoted")}
          value={profileStats.total_votes}
        />
      </div>

      {/* Tendency & Consistency Section */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <SectionHeader
          icon={<AlertCircle className="w-4 h-4" />}
          title={t("users.voterProfile")}
        />

        <div className="space-y-4">
          {/* Explanation text */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("users.voterProfileExplanation")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Tendency */}
            {userTendency && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                <div
                  className={`rounded-lg p-2 ${userTendency.color} bg-current/10`}
                >
                  <userTendency.icon
                    className={`w-5 h-5 ${userTendency.color}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("users.tendency")}
                  </p>
                  <p className={`text-sm font-bold ${userTendency.color}`}>
                    {userTendency.label}
                  </p>
                </div>
              </div>
            )}

            {/* Consistency */}
            {consistencyLevel && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("users.consistency")}
                  </p>
                  <Badge className={`${consistencyLevel.color} border`}>
                    {consistencyLevel.label}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    σ = {profileStats.standard_deviation?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Consensus Agreement */}
            {profileStats.above_consensus_percentage !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="rounded-lg bg-cyan-500/10 p-2">
                      <Percent className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {t("users.aboveConsensus")}
                        <Info className="w-3 h-3" />
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {profileStats.above_consensus_percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{t("users.aboveConsensusTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {profileStats.average_deviation_from_consensus !== null && (
            <div className="mt-4 border-t border-border pt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      {t("users.avgDeviationFromConsensus")}
                      <Info className="w-3 h-3" />
                    </span>
                    <span className="font-bold tabular-nums text-foreground">
                      {profileStats.average_deviation_from_consensus.toFixed(2)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{t("users.avgDeviationTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
