import { useState, useEffect, useMemo, type ReactNode } from "react";
import { GetServerSideProps } from "next";
import { useTranslation } from "react-i18next";
import { Scale, Flame, Handshake, Film, Sigma, Users, Info } from "lucide-react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { LoadingCard, StatCard, EmptyState } from "@/components/cineforum/common";
import { RankingCard } from "@/components/cineforum/rankings";
import { fetchConsensusRankings } from "@/lib/client/cineforum";
import type { ConsensusMovieDTO } from "@/lib/shared/types";

type Props = { cineforumId: string; cineforumName: string };

/** How many movies to reveal per page; a "show more" button loads the next batch. */
const PAGE_SIZE = 25;

type Tab = "divisive" | "unanimous";

export default function ConsensusPage({ cineforumId, cineforumName }: Props) {
  const { t } = useTranslation("rankings");
  const [data, setData] = useState<ConsensusMovieDTO[]>([]);
  const [minVotes, setMinVotes] = useState(3);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("divisive");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetchConsensusRankings(cineforumId)
      .then((res) => {
        setData(res.body);
        setMinVotes(res.min_votes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cineforumId]);

  const stats = useMemo(() => {
    if (data.length === 0)
      return { analyzed: 0, avgStdDev: null as number | null, mostDivisive: "—" };
    const avg =
      data.reduce((s, m) => s + m.std_dev, 0) / data.length;
    return {
      analyzed: data.length,
      avgStdDev: Math.round(avg * 100) / 100,
      mostDivisive: data[0]?.movie ?? "—",
    };
  }, [data]);

  // `data` arrives sorted by divergence (highest first). The unanimous tab is
  // the same ranking read from the other end.
  const list = useMemo(() => {
    return tab === "divisive" ? data : [...data].reverse();
  }, [data, tab]);

  const visible = list.slice(0, visibleCount);

  const TabButton = ({
    value,
    icon,
    label,
  }: {
    value: Tab;
    icon: ReactNode;
    label: string;
  }) => {
    const active = tab === value;
    return (
      <button
        onClick={() => {
          setTab(value);
          setExpandedId(null);
          setVisibleCount(PAGE_SIZE);
        }}
        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-100">
          <LoadingCard text={t("consensus.loading")} />
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
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("consensus.pageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("consensus.pageSubtitle")}
          </p>
        </div>

        {/* How the metric is computed */}
        <div
          className="mb-8 flex gap-3 rounded-xl border border-border bg-muted/30 p-4 animate-fade-in-up"
          style={{ animationDelay: "50ms" }}
        >
          <div className="shrink-0 rounded-lg bg-primary/10 p-2 h-fit">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground mb-1">
              {t("consensus.metricTitle")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("consensus.metricExplanation")}
            </p>
          </div>
        </div>

        {data.length === 0 ? (
          <EmptyState
            icon={<Scale className="w-8 h-8 text-muted-foreground" />}
            title={t("consensus.emptyTitle")}
            subtitle={t("consensus.emptySubtitle", { count: minVotes })}
          />
        ) : (
          <>
            {/* Summary stats */}
            <div
              className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              <StatCard
                icon={<Film className="w-5 h-5 text-primary" />}
                iconBg="bg-primary/10"
                label={t("consensus.statAnalyzed")}
                value={stats.analyzed}
                tooltip={t("consensus.statAnalyzedTooltip", { count: minVotes })}
              />
              <StatCard
                icon={<Sigma className="w-5 h-5 text-blue-500" />}
                iconBg="bg-blue-500/10"
                label={t("consensus.statAvgStdDev")}
                value={stats.avgStdDev !== null ? stats.avgStdDev.toFixed(2) : "—"}
                tooltip={t("consensus.statAvgStdDevTooltip")}
              />
              <StatCard
                icon={<Flame className="w-5 h-5 text-amber-500" />}
                iconBg="bg-amber-500/10"
                label={t("consensus.statMostDivisive")}
                value={stats.mostDivisive}
              />
            </div>

            {/* Tabs */}
            <div
              className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1 animate-fade-in-up"
              style={{ animationDelay: "150ms" }}
            >
              <TabButton
                value="divisive"
                icon={<Flame className="w-4 h-4" />}
                label={t("consensus.tabDivisive")}
              />
              <TabButton
                value="unanimous"
                icon={<Handshake className="w-4 h-4" />}
                label={t("consensus.tabUnanimous")}
              />
            </div>

            {/* List */}
            <div
              className="space-y-2 sm:space-y-3 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              {visible.map((m, index) => {
                const isExpanded = expandedId === m.id;
                return (
                  <RankingCard
                    key={m.id}
                    position={index + 1}
                    title={m.movie}
                    rating={m.std_dev}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : m.id)}
                    badges={
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
                        {m.min_rating.toFixed(2)}–{m.max_rating.toFixed(2)}
                      </span>
                    }
                  >
                    <div className="space-y-6">
                      {/* Round + proposer + average */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg border border-border">
                          <span className="text-sm text-muted-foreground">
                            {t("consensus.roundLabel")}
                          </span>
                          <span className="font-bold text-foreground">{m.round}</span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg border border-border">
                          <span className="text-sm text-muted-foreground">
                            {t("consensus.proposedByLabel")}
                          </span>
                          <span className="font-bold text-foreground">{m.owner}</span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg border border-border">
                          <span className="text-sm text-muted-foreground">
                            {t("consensus.avgLabel")}
                          </span>
                          <span className="font-bold text-foreground tabular-nums">
                            {m.average_rating.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Member votes */}
                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                          <Users className="w-4 h-4" />
                          {t("consensus.votesTitle")}
                        </h3>
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                          <div className="bg-secondary/50 px-4 py-3 border-b border-border">
                            <div className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              <div className="flex-1">{t("consensus.colUser")}</div>
                              <div className="w-20 sm:w-24 text-right">
                                {t("consensus.colRating")}
                              </div>
                            </div>
                          </div>
                          <div className="divide-y divide-border">
                            {m.movie_votes.map((vote) => (
                              <div
                                key={vote.id}
                                className="flex items-center px-4 py-3 sm:py-4 hover:bg-secondary/30 transition-colors"
                              >
                                <div className="flex-1">
                                  <span className="text-sm sm:text-base text-foreground font-medium">
                                    {vote.user}
                                  </span>
                                </div>
                                <div className="w-20 sm:w-24 text-right">
                                  <span className="font-bold text-sm sm:text-base text-gradient tabular-nums">
                                    {vote.rating.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </RankingCard>
                );
              })}
            </div>

            {/* Show more / footer note */}
            <div className="flex flex-col items-center gap-3 pt-6">
              {visibleCount < list.length && (
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-muted/40"
                >
                  {t("consensus.showMore")}
                </button>
              )}
              <p className="text-center text-muted-foreground text-xs">
                {t("consensus.showingCount", {
                  shown: visible.length,
                  total: list.length,
                })}{" "}
                · {t("consensus.minVotesNote", { count: minVotes })}
              </p>
            </div>
          </>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
