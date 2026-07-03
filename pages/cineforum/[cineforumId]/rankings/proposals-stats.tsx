import { useState, useEffect, useMemo } from "react";
import { GetServerSideProps } from "next";
import { useTranslation } from "react-i18next";
import { BarChart2, FileText, ThumbsUp, Clock } from "lucide-react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { LoadingCard, StatCard, EmptyState } from "@/components/cineforum/common";
import ProposalStatsTable from "@/components/cineforum/rankings/ProposalStatsTable";
import { fetchProposalUserStats } from "@/lib/client/cineforum";
import type { ProposalUserStatDTO } from "@/lib/shared/types";

type Props = { cineforumId: string; cineforumName: string };

export default function ProposalStatsPage({ cineforumId, cineforumName }: Props) {
  const { t } = useTranslation("rankings");
  const [data, setData] = useState<ProposalUserStatDTO[]>([]);
  const [totals, setTotals] = useState({ created: 0, voted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposalUserStats(cineforumId)
      .then((res) => {
        setData(res.body);
        setTotals({ created: res.total_created, voted: res.total_voted });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cineforumId]);

  const stats = useMemo(() => {
    // Authoritative totals come from the server (they include team-owned
    // proposals and proposals by removed members, which the per-user rows
    // either omit or attribute to multiple team members).
    const withDelay = data.filter((u) => u.avg_vote_delay_hours !== null);
    const avgDelay =
      withDelay.length > 0
        ? withDelay.reduce((s, u) => s + u.avg_vote_delay_hours!, 0) / withDelay.length
        : null;
    return { totalCreated: totals.created, totalVoted: totals.voted, avgDelay };
  }, [data, totals]);

  function formatDelayCompact(h: number | null) {
    if (h === null) return "—";
    if (h < 1) return `${Math.round(h * 60)}min`;
    if (h < 24) return `${h.toFixed(1)}h`;
    return `${(h / 24).toFixed(1)}gg`;
  }

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-100">
          <LoadingCard text={t("proposalStats.loading")} />
        </div>
      </CineforumLayout>
    );
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 glow-red-soft">
              <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("proposalStats.pageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("proposalStats.pageSubtitle")}
          </p>
        </div>

        {/* Summary stats */}
        <div
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <StatCard
            icon={<FileText className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/10"
            label={t("proposalStats.statTotalCreated")}
            value={stats.totalCreated}
          />
          <StatCard
            icon={<ThumbsUp className="w-5 h-5 text-blue-500" />}
            iconBg="bg-blue-500/10"
            label={t("proposalStats.statTotalVoted")}
            value={stats.totalVoted}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            label={t("proposalStats.statAvgDelay")}
            value={formatDelayCompact(stats.avgDelay)}
            tooltip={t("proposalStats.statAvgDelayTooltip")}
          />
        </div>

        {/* Table */}
        {data.length === 0 ? (
          <EmptyState
            icon={<BarChart2 className="w-8 h-8 text-muted-foreground" />}
            title={t("proposalStats.emptyTitle")}
            subtitle={t("proposalStats.emptySubtitle")}
          />
        ) : (
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <ProposalStatsTable data={data} />
          </div>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
