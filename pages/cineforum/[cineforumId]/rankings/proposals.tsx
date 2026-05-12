import { useState, useMemo } from "react";
import { GetServerSideProps } from "next";
import { useTranslation } from "react-i18next";
import prisma from "@/lib/prisma";
import CineforumLayout from "@/components/CineforumLayout";
import {
  ProposalDetailDTO,
  ProposalsListResponseDTO,
  ProposalRankingDTO,
} from "@/lib/shared/types/cineforum";
import {
  fetchAllProposals,
  fetchRanking,
} from "@/lib/client/cineforum/proposals";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExpandableText } from "@/components/ui/expandable-text";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Film, Trophy } from "lucide-react"; // Trophy kept for winner info block below
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import ProposalMovieCard from "@/components/cineforum/proposal/shared/ProposalMovieCard";
import ProposalVotesAccordion from "@/components/cineforum/proposal/shared/ProposalVotesAccordion";
import ProposalOwnerBadge from "@/components/cineforum/proposal/shared/ProposalOwnerBadge";

const NO_ROUND_KEY = "__no_round__";

interface ProposalsHistoryPageProps {
  cineforumId: string;
  cineforumName: string;
  initialData: ProposalsListResponseDTO;
}

export default function ProposalsHistoryPage({
  cineforumId,
  cineforumName,
  initialData,
}: ProposalsHistoryPageProps) {
  const { t, i18n } = useTranslation("rankings");
  const [proposals, setProposals] = useState<ProposalDetailDTO[]>(
    initialData.proposals,
  );
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rankings, setRankings] = useState<Record<string, ProposalRankingDTO>>(
    {},
  );
  const [loadingRankings, setLoadingRankings] = useState<
    Record<string, boolean>
  >({});

  const proposalsByRound = useMemo(() => {
    const grouped = new Map<string, ProposalDetailDTO[]>();
    proposals.forEach((proposal) => {
      const roundKey = proposal.round || NO_ROUND_KEY;
      if (!grouped.has(roundKey)) grouped.set(roundKey, []);
      grouped.get(roundKey)!.push(proposal);
    });
    return Array.from(grouped.entries()).map(([round, items]) => ({
      round,
      proposals: items,
    }));
  }, [proposals]);

  const handleLoadMore = async () => {
    if (!cineforumId || loading || !pagination.hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllProposals(
        cineforumId,
        pagination.page + 1,
        pagination.limit,
      );
      setProposals((prev) => [...prev, ...data.proposals]);
      setPagination(data.pagination);
    } catch (err) {
      setError(t("proposals.loadError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRanking = async (proposalId: string) => {
    if (rankings[proposalId] || loadingRankings[proposalId]) return;
    setLoadingRankings((prev) => ({ ...prev, [proposalId]: true }));
    try {
      const ranking = await fetchRanking(proposalId);
      setRankings((prev) => ({ ...prev, [proposalId]: ranking }));
    } catch (err) {
      console.error("Failed to load ranking", err);
    } finally {
      setLoadingRankings((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("proposals.pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("proposals.pageSubtitle")}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {proposals.length > 0 ? (
          <InfiniteScroll
            items={proposalsByRound}
            hasMore={pagination.hasMore}
            isLoading={loading}
            onLoadMore={handleLoadMore}
            className="space-y-8"
            renderItem={(group, groupIndex) => (
              <div key={`${group.round}-${groupIndex}`} className="space-y-4">
                {/* Round header */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {group.round === NO_ROUND_KEY
                      ? t("proposals.noRound")
                      : group.round}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Proposals accordion — all collapsed by default */}
                <Accordion type="single" collapsible className="space-y-2">
                  {group.proposals.map((proposal) => (
                    <AccordionItem
                      key={proposal.id}
                      value={proposal.id}
                      className="rounded-lg border bg-card"
                    >
                      <AccordionTrigger
                        className="px-4 hover:no-underline overflow-hidden"
                        onClick={() => loadRanking(proposal.id)}
                      >
                        {/* Mobile: two-line layout — title + owner on top, nothing else */}
                        {/* sm+: single-row layout with date and status */}
                        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-2 sm:flex-row sm:items-center sm:gap-2">
                          {/* Row 1 (mobile) / single row (sm+) */}
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate text-left font-semibold">
                              {proposal.title}
                            </span>
                          </div>

                          {/* Row 2 on mobile: owner + status */}
                          <div className="flex items-center gap-2 sm:shrink-0">
                            {proposal.owner && (
                              <ProposalOwnerBadge
                                owner={proposal.owner}
                                tNamespace="proposal"
                              />
                            )}
                            <span className="hidden text-sm text-muted-foreground sm:inline">
                              {proposal.date
                                ? new Date(proposal.date).toLocaleDateString(
                                    i18n.language,
                                  )
                                : t("proposals.noDate")}
                            </span>
                            <span
                              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                proposal.closed
                                  ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                                  : "border border-amber-100 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {proposal.closed
                                ? t("proposals.statusClosed")
                                : t("proposals.statusOpen")}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4 pt-2">
                          {/* Description */}
                          {proposal.description && (
                            <div className="rounded-md border bg-muted/50 p-3">
                              <ExpandableText
                                text={proposal.description}
                                maxLength={150}
                                html
                              />
                            </div>
                          )}

                          {/* Date */}
                          {proposal.date && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(proposal.date).toLocaleDateString(
                                i18n.language,
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          )}

                          {/* Movies — sorted by Schulze rank when available */}
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              {t("proposals.moviesCount", {
                                count: proposal.movies.length,
                              })}
                            </Label>
                            <div className="space-y-2">
                              {[...proposal.movies]
                                .sort((a, b) => {
                                  const ranking = rankings[proposal.id];
                                  if (!ranking) return 0;
                                  const ra =
                                    ranking.sorted_movies.find(
                                      (m) => m.id === a.id,
                                    )?.proposal_rank ?? Infinity;
                                  const rb =
                                    ranking.sorted_movies.find(
                                      (m) => m.id === b.id,
                                    )?.proposal_rank ?? Infinity;
                                  return ra - rb;
                                })
                                .map((movie) => {
                                  const ranking = rankings[proposal.id];
                                  const rankedMovie = ranking
                                    ? ranking.sorted_movies.find(
                                        (m) => m.id === movie.id,
                                      )
                                    : null;
                                  // For open proposals without an official winner, highlight rank-1 as "leading"
                                  const isLeading =
                                    !proposal.winner &&
                                    !proposal.closed &&
                                    !!rankedMovie &&
                                    rankedMovie.proposal_rank === 1;

                                  return (
                                    <ProposalMovieCard
                                      key={movie.id}
                                      movie={movie}
                                      isWinner={
                                        proposal.winner?.id === movie.id
                                      }
                                      isLeading={isLeading}
                                      rankedMovie={rankedMovie}
                                      tNamespace="rankings"
                                    />
                                  );
                                })}
                            </div>
                          </div>

                          {/* Voting Results */}
                          <ProposalVotesAccordion
                            votes={proposal.votes ?? []}
                            movies={proposal.movies}
                            tNamespace="rankings"
                          />

                          {/* Winner info */}
                          {proposal.winner && (
                            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                              <Trophy className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold text-primary">
                                {proposal.winner.title}
                              </span>
                              {proposal.winner.year && (
                                <span className="text-xs text-muted-foreground">
                                  ({proposal.winner.year})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
            loader={
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  {t("proposals.loading")}
                </div>
              </div>
            }
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t("proposals.emptyTitle")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cineforumProps = await getCineforumLayoutProps(context);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }

  const { cineforumId } = cineforumProps.props as {
    cineforumId: string;
    cineforumName: string;
  };

  const limit = 10;
  const totalCount = await prisma.proposal.count({ where: { cineforumId } });

  const proposals = await prisma.proposal.findMany({
    where: { cineforumId, closed: true },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      movies: { include: { movie: true } },
      round: true,
      ownerUser: true,
      ownerTeam: true,
      winner: true,
      votes: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return {
    props: {
      ...cineforumProps.props,
      initialData: {
        proposals: proposals.map((proposal) => ({
          id: proposal.id,
          date: proposal.date?.toISOString() || null,
          title: proposal.title,
          description: proposal.description,
          closed: proposal.closed,
          show_results: proposal.showResults,
          round: proposal.round?.name || null,
          roundId: proposal.roundId,
          roundClosed: proposal.round?.closed || false,
          winner: proposal.winner
            ? {
                id: proposal.winner.id,
                title: proposal.winner.title,
                year: proposal.winner.year,
                image: proposal.winner.image,
              }
            : null,
          owner: proposal.ownerUserId
            ? {
                id: proposal.ownerUserId,
                type: "User" as const,
                name: proposal.ownerUser?.name || null,
              }
            : {
                id: proposal.ownerTeamId!,
                type: "Team" as const,
                name: proposal.ownerTeam?.name || null,
              },
          movies: proposal.movies.map((pm) => ({
            id: pm.movie.id,
            title: pm.movie.title,
            year: pm.movie.year,
            image: pm.movie.image,
            imageMedium: pm.movie.imageMedium,
          })),
          votes: proposal.votes.map((v) => ({
            id: v.id,
            user: { id: v.user.id, name: v.user.name },
            movie_selection: v.movieSelection as Record<string, string[]>,
          })),
          created_at: proposal.createdAt.toISOString(),
          missing_users: [],
          no_votes_left: false,
        })),
        pagination: {
          page: 1,
          limit,
          total: totalCount,
          hasMore: proposals.length < totalCount,
        },
      },
    },
  };
};
