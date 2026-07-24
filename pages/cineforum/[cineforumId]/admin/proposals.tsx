import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import type {
  ProposalDetailDTO,
  ImdbMovieData,
  ProposalRankingDTO,
} from "@/lib/shared/types/cineforum";
import {
  adminProposalsClient,
  type MovieUpdateData,
} from "@/lib/client/cineforum/admin-proposals";
import { fetchRanking } from "@/lib/client/cineforum/proposals";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExpandableText } from "@/components/ui/expandable-text";
import ProposalMovieCard, {
  type ProposalMovieCardMovie,
} from "@/components/cineforum/proposal/shared/ProposalMovieCard";
import ProposalVotesAccordion from "@/components/cineforum/proposal/shared/ProposalVotesAccordion";
import ProposalMovieSearch from "@/components/cineforum/admin/ProposalMovieSearch";
import ProposalActionBar from "@/components/cineforum/admin/ProposalActionBar";
import CloseProposalDialog from "@/components/cineforum/admin/CloseProposalDialog";
import VoteLockIndicator from "@/components/cineforum/admin/VoteLockIndicator";
import { computeVoteLock } from "@/lib/shared/ranking/voteLock";
import { Calendar, Film, Plus, History } from "lucide-react";

interface AdminProposalsPageProps {
  cineforumId: string;
  cineforumName: string;
  currentProposal: ProposalDetailDTO | null;
  /** Enabled members who have not voted on the current proposal yet. */
  remainingVoters: number;
}

export default function AdminProposalsPage({
  cineforumId,
  cineforumName,
  currentProposal: initialProposal,
  remainingVoters,
}: AdminProposalsPageProps) {
  const { t } = useTranslation("admin");
  const { isAdmin, isLoading: isLoadingAccess } = useAdminAccess(cineforumId);

  const [proposal, setProposal] = useState<ProposalDetailDTO | null>(
    initialProposal,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState<string>("");
  const [editMovies, setEditMovies] = useState<MovieUpdateData[]>([]);
  const [showMovieSearch, setShowMovieSearch] = useState(false);

  // Ranking state
  const [ranking, setRanking] = useState<ProposalRankingDTO | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(false);

  // Auto-load ranking as soon as the proposal id is known
  useEffect(() => {
    const proposalId = proposal?.id;
    if (!proposalId) return;
    let cancelled = false;
    setLoadingRanking(true);
    fetchRanking(proposalId)
      .then((r) => {
        if (!cancelled) setRanking(r);
      })
      .catch((err) => console.error("Failed to load ranking", err))
      .finally(() => {
        if (!cancelled) setLoadingRanking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal?.id]);

  const handleCloseProposal = async (winnerId: string) => {
    if (!proposal || !cineforumId) return;
    setLoading(true);
    setError(null);
    try {
      const closed = await adminProposalsClient.closeProposal(
        cineforumId,
        proposal.id,
        winnerId,
      );
      setProposal(closed);
      setShowCloseDialog(false);
    } catch (err) {
      setError(t("proposals.closeError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReopenProposal = async () => {
    if (!proposal || !cineforumId) return;
    setLoading(true);
    setError(null);
    try {
      const reopened = await adminProposalsClient.reopenProposal(
        cineforumId,
        proposal.id,
      );
      setProposal(reopened);
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : null) ??
          t("proposals.reopenError"),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResults = async () => {
    if (!proposal || !cineforumId) return;
    if (isEditing) cancelEditing();
    setLoading(true);
    setError(null);
    try {
      const updated = await adminProposalsClient.updateProposal(
        cineforumId,
        proposal.id,
        {
          show_results: !proposal.show_results,
        },
      );
      setProposal(updated);
    } catch (err) {
      setError(t("proposals.updateError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!proposal) return;
    setIsEditing(true);
    setEditDate(
      proposal.date ? new Date(proposal.date).toISOString().split("T")[0] : "",
    );
    setEditMovies(
      proposal.movies.map((m) => ({
        id: m.id,
        l: m.title,
        y: m.year,
        title: m.title,
        year: m.year,
        imageMedium: m.imageMedium,
        image: m.image,
        i: [m.imageMedium, m.image],
      })),
    );
    setShowMovieSearch(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditDate("");
    setEditMovies([]);
    setShowMovieSearch(false);
  };

  const saveEditing = async () => {
    if (!proposal || !cineforumId) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await adminProposalsClient.updateProposal(
        cineforumId,
        proposal.id,
        {
          date: editDate || null,
          movies: editMovies,
        },
      );
      setProposal(updated);
      cancelEditing();
    } catch (err) {
      setError(t("proposals.updateError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeMovie = (movieId: string) => {
    setEditMovies((prev) => prev.filter((m) => m.id !== movieId));
  };

  const addMovieFromSearch = (movie: ImdbMovieData) => {
    if (editMovies.some((m) => m.id === movie.id)) return;
    setEditMovies((prev) => [...prev, movie]);
  };

  // Is the winner already decided by the votes cast so far?
  // (must run before any early return to keep hook order stable)
  const voteLock = useMemo(() => {
    if (!proposal || !proposal.votes || proposal.votes.length === 0) return null;
    return computeVoteLock(
      proposal.votes,
      proposal.movies.map((m) => m.id),
      remainingVoters,
    );
  }, [proposal, remainingVoters]);

  if (isLoadingAccess) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          {t("proposals.loading") || t("rounds.loading")}
        </div>
      </CineforumLayout>
    );
  }

  if (!isAdmin) return null;

  const displayMovies: ProposalMovieCardMovie[] = isEditing
    ? editMovies
    : (proposal?.movies ?? []);
  const displayDate = isEditing ? editDate : proposal?.date;

  const voteLockWinnerTitle = voteLock?.winnerId
    ? (proposal?.movies.find((m) => m.id === voteLock.winnerId)?.title ?? null)
    : null;

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("proposals.pageTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("proposals.pageSubtitle")}
            </p>
          </div>
          <Link
            href={`/cineforum/${cineforumId}/rankings/proposals`}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("proposals.historyLink")}
            </span>
          </Link>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* No proposal */}
        {!proposal ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t("proposals.noProposal")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm">
            {/* Proposal header bar */}
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                  <Film className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold truncate">{proposal.title}</span>
                {proposal.round && (
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-muted-foreground shrink-0">
                    {proposal.round}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {displayDate
                    ? new Date(displayDate).toLocaleDateString()
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

            <div className="space-y-5 p-4">
              {/* Description */}
              {proposal.description && (
                <div className="rounded-xl border bg-muted/50 p-3">
                  <ExpandableText
                    text={proposal.description}
                    maxLength={150}
                    html
                  />
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t("proposals.dateLabel")}
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="max-w-xs"
                  />
                ) : (
                  <p className="text-sm">
                    {displayDate
                      ? new Date(displayDate).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : t("proposals.noDateSet")}
                  </p>
                )}
              </div>

              {/* Movies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {t("proposals.moviesCount", {
                      count: displayMovies.length,
                    })}
                  </Label>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMovieSearch(!showMovieSearch)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t("proposals.addMovie")}
                    </Button>
                  )}
                </div>

                {isEditing && showMovieSearch && (
                  <ProposalMovieSearch onMovieAdd={addMovieFromSearch} />
                )}

                <div className="space-y-2">
                  {[...displayMovies]
                    .sort((a, b) => {
                      if (isEditing || !ranking) return 0;
                      const ra =
                        ranking.sorted_movies.find((m) => m.id === a.id)
                          ?.proposal_rank ?? Infinity;
                      const rb =
                        ranking.sorted_movies.find((m) => m.id === b.id)
                          ?.proposal_rank ?? Infinity;
                      return ra - rb;
                    })
                    .map((movie) => {
                      const rankedMovie =
                        !isEditing && ranking
                          ? ranking.sorted_movies.find((m) => m.id === movie.id)
                          : null;
                      const isLeading =
                        !isEditing &&
                        !proposal.winner &&
                        !proposal.closed &&
                        !!rankedMovie &&
                        rankedMovie.proposal_rank === 1;

                      return (
                        <ProposalMovieCard
                          key={movie.id}
                          movie={movie}
                          isWinner={
                            !isEditing && proposal.winner?.id === movie.id
                          }
                          isLeading={isLeading}
                          rankedMovie={rankedMovie}
                          tNamespace="admin"
                          onRemove={isEditing ? removeMovie : undefined}
                        />
                      );
                    })}
                </div>
              </div>

              {/* Vote lock: is the winner already decided? */}
              {!isEditing && !proposal.closed && voteLock && (
                <VoteLockIndicator
                  lock={voteLock}
                  winnerTitle={voteLockWinnerTitle}
                />
              )}

              {/* Voting Results */}
              {!isEditing && proposal.votes && proposal.votes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {t("proposals.votingResults", {
                      count: proposal.votes.length,
                    })}
                  </Label>
                  <ProposalVotesAccordion
                    votes={proposal.votes}
                    movies={proposal.movies}
                    tNamespace="admin"
                  />
                </div>
              )}

              {/* Additional Info */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("proposals.ownerLabel")}
                  </span>
                  <span className="font-medium">
                    {proposal.owner?.type} –{" "}
                    {proposal.owner?.name ?? proposal.owner?.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("proposals.resultsLabel")}
                  </span>
                  <span className="font-medium">
                    {proposal.show_results
                      ? t("proposals.resultsVisible")
                      : t("proposals.resultsHidden")}
                  </span>
                </div>
                {proposal.winner && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("proposals.winnerLabel")}
                    </span>
                    <span className="font-medium">{proposal.winner.title}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isEditing ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    onClick={saveEditing}
                    disabled={loading || editMovies.length === 0}
                    size="sm"
                  >
                    {t("proposals.saveChanges")}
                  </Button>
                  <Button
                    onClick={cancelEditing}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    {t("proposals.cancel")}
                  </Button>
                </div>
              ) : (
                <ProposalActionBar
                  proposal={proposal}
                  loading={loading}
                  onEdit={startEditing}
                  onOpenCloseDialog={() => setShowCloseDialog(true)}
                  onReopen={handleReopenProposal}
                  onToggleResults={handleToggleResults}
                />
              )}
            </div>
          </div>
        )}

        {/* Close Proposal Dialog */}
        {proposal && (
          <CloseProposalDialog
            open={showCloseDialog}
            onOpenChange={setShowCloseDialog}
            proposal={proposal}
            loading={loading}
            onConfirm={handleCloseProposal}
          />
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
  const session = await getServerSession(context.req, context.res, authOptions);

  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: (session.user as { id: string }).id,
        cineforumId,
      },
    },
  });

  if (!membership || !["ADMIN", "OWNER"].includes(membership.role)) {
    return {
      redirect: { destination: `/cineforum/${cineforumId}`, permanent: false },
    };
  }

  const proposal = await prisma.proposal.findFirst({
    where: { cineforumId },
    orderBy: [{ closed: "asc" }, { date: "desc" }],
    include: {
      movies: { include: { movie: true } },
      round: true,
      ownerUser: true,
      ownerTeam: true,
      winner: true,
      votes: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  // Enabled members who have not yet voted on this proposal. Used to tell the
  // admin whether the remaining ballots could still change the winner.
  let remainingVoters = 0;
  if (proposal) {
    const enabledMembers = await prisma.membership.findMany({
      where: { cineforumId, disabled: false },
      select: { userId: true },
    });
    const votedUserIds = new Set(proposal.votes.map((v) => v.userId));
    remainingVoters = enabledMembers.filter(
      (m) => !votedUserIds.has(m.userId),
    ).length;
  }

  const currentProposal: ProposalDetailDTO | null = proposal
    ? {
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
        my_vote: null,
      }
    : null;

  return {
    props: { ...cineforumProps.props, currentProposal, remainingVoters },
  };
};
