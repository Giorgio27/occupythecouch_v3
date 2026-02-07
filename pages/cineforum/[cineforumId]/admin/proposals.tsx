import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import {
  ProposalDetailDTO,
  ProposalsListResponseDTO,
} from "@/lib/shared/types/cineforum";
import { adminProposalsClient } from "@/lib/client/cineforum/admin-proposals";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";

interface AdminProposalsPageProps {
  initialData: ProposalsListResponseDTO;
}

export default function AdminProposalsPage({
  initialData,
}: AdminProposalsPageProps) {
  const router = useRouter();
  const { cineforumId } = router.query;
  const { isAdmin, isLoading: isLoadingAccess } = useAdminAccess(
    cineforumId as string,
  );

  const [proposals, setProposals] = useState<ProposalDetailDTO[]>(
    initialData.proposals,
  );
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] =
    useState<ProposalDetailDTO | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  // Group proposals by round
  const proposalsByRound = useMemo(() => {
    const grouped = new Map<string, ProposalDetailDTO[]>();

    proposals.forEach((proposal) => {
      const roundKey = proposal.round || "No Round";
      if (!grouped.has(roundKey)) {
        grouped.set(roundKey, []);
      }
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
      const nextPage = pagination.page + 1;
      const data = await adminProposalsClient.getAllProposals(
        cineforumId as string,
        nextPage,
        pagination.limit,
      );
      setProposals((prev) => [...prev, ...data.proposals]);
      setPagination(data.pagination);
    } catch (err) {
      setError("Failed to load more proposals");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCloseDialog = (proposal: ProposalDetailDTO) => {
    setSelectedProposal(proposal);
    setShowCloseDialog(true);
    setSelectedWinnerId(null);
  };

  const handleCloseProposal = async () => {
    if (!selectedProposal || !cineforumId || !selectedWinnerId) return;

    setLoading(true);
    setError(null);
    try {
      const closedProposal = await adminProposalsClient.closeProposal(
        cineforumId as string,
        selectedProposal.id,
        selectedWinnerId,
      );

      // Update the proposal in the list
      setProposals((prev) =>
        prev.map((p) => (p.id === closedProposal.id ? closedProposal : p)),
      );

      setShowCloseDialog(false);
      setSelectedProposal(null);
      setSelectedWinnerId(null);
    } catch (err) {
      setError("Failed to close proposal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResults = async (proposal: ProposalDetailDTO) => {
    if (!cineforumId) return;

    setLoading(true);
    setError(null);
    try {
      const updatedProposal = await adminProposalsClient.updateProposal(
        cineforumId as string,
        proposal.id,
        { show_results: !proposal.show_results },
      );

      // Update the proposal in the list
      setProposals((prev) =>
        prev.map((p) => (p.id === updatedProposal.id ? updatedProposal : p)),
      );
    } catch (err) {
      setError("Failed to update proposal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAccess) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  }

  // If not admin, the hook will redirect, but show nothing while redirecting
  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            All Proposals
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all proposals for this cineforum, grouped by oscar/round.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Proposals grouped by round with infinite scroll */}
        {proposals.length > 0 ? (
          <InfiniteScroll
            items={proposalsByRound}
            hasMore={pagination.hasMore}
            isLoading={loading}
            onLoadMore={handleLoadMore}
            className="space-y-8"
            renderItem={(group, index) => (
              <div key={`${group.round}-${index}`} className="space-y-4">
                {/* Round header */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {group.round}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Proposals in this round */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.proposals.map((proposal) => (
                    <Card key={proposal.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-tight">
                            {proposal.title}
                          </CardTitle>
                          <span
                            className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              proposal.closed
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            {proposal.closed ? "Closed" : "Open"}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col gap-4">
                        {/* Proposal info */}
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">
                              {proposal.date
                                ? new Date(proposal.date).toLocaleDateString()
                                : "No date"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Owner:
                            </span>
                            <span className="font-medium">
                              {proposal.owner?.type} -{" "}
                              {proposal.owner?.id.slice(0, 8)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Results:
                            </span>
                            <span className="font-medium">
                              {proposal.show_results ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          {proposal.winner && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Winner:
                              </span>
                              <span className="font-medium">
                                {proposal.winner.title}
                              </span>
                            </div>
                          )}
                        </div>

                        {proposal.description && (
                          <div className="rounded-md border bg-muted/50 p-2 text-xs text-muted-foreground">
                            {proposal.description}
                          </div>
                        )}

                        {/* Movies preview */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground">
                            Movies ({proposal.movies.length})
                          </h4>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {proposal.movies.map((movie) => (
                              <div
                                key={movie.id}
                                className="flex shrink-0 flex-col gap-1"
                                style={{ width: "80px" }}
                              >
                                {movie.imageMedium ? (
                                  <img
                                    src={movie.imageMedium}
                                    alt={movie.title}
                                    className="h-28 w-20 rounded object-cover"
                                  />
                                ) : (
                                  <div className="flex h-28 w-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                    No image
                                  </div>
                                )}
                                <p
                                  className="truncate text-xs font-medium"
                                  title={movie.title}
                                >
                                  {movie.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto flex gap-2 pt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={
                                    proposal.closed ? "cursor-not-allowed" : ""
                                  }
                                >
                                  <Button
                                    onClick={() =>
                                      handleOpenCloseDialog(proposal)
                                    }
                                    disabled={loading || proposal.closed}
                                    variant={
                                      proposal.closed ? "outline" : "default"
                                    }
                                    size="sm"
                                    className="flex-1"
                                  >
                                    Close
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {proposal.closed
                                  ? "Already closed"
                                  : "Close and select winner"}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleToggleResults(proposal)}
                                  disabled={loading}
                                  variant={
                                    proposal.show_results
                                      ? "secondary"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="flex-1"
                                >
                                  {proposal.show_results ? "Hide" : "Show"}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Toggle results visibility
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            loader={
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading more proposals...
                </div>
              </div>
            }
            endMessage={
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  All proposals loaded
                </div>
              </div>
            }
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No proposals found for this cineforum.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Close Proposal Dialog */}
        <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Proposal</DialogTitle>
              <DialogDescription>
                Select the winning movie to close this proposal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              {selectedProposal?.movies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => setSelectedWinnerId(movie.id)}
                  className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent ${
                    selectedWinnerId === movie.id
                      ? "border-primary bg-accent"
                      : "border-border"
                  }`}
                >
                  {movie.imageMedium && (
                    <img
                      src={movie.imageMedium}
                      alt={movie.title}
                      className="h-16 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{movie.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {movie.year}
                    </p>
                  </div>
                  {selectedWinnerId === movie.id && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseProposal}
                disabled={loading || !selectedWinnerId}
              >
                {loading ? "Closing..." : "Close Proposal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const cineforumId = context.params?.cineforumId as string;

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  // Check if user is admin or owner of this cineforum
  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: (session.user as any).id,
        cineforumId,
      },
    },
  });

  if (!membership || !["ADMIN", "OWNER"].includes(membership.role)) {
    return {
      redirect: {
        destination: `/cineforum/${cineforumId}`,
        permanent: false,
      },
    };
  }

  // Fetch initial proposals with pagination
  const limit = 10;
  const totalCount = await prisma.proposal.count({
    where: { cineforumId },
  });

  const proposals = await prisma.proposal.findMany({
    where: { cineforumId },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      movies: { include: { movie: true } },
      round: true,
      ownerUser: true,
      ownerTeam: true,
      winner: true,
    },
  });

  return {
    props: {
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
          winner: proposal.winner
            ? {
                id: proposal.winner.id,
                title: proposal.winner.title,
                year: proposal.winner.year,
                image: proposal.winner.image,
              }
            : null,
          owner: proposal.ownerUserId
            ? { id: proposal.ownerUserId, type: "User" }
            : { id: proposal.ownerTeamId!, type: "Team" },
          movies: proposal.movies.map((pm) => ({
            id: pm.movie.id,
            title: pm.movie.title,
            year: pm.movie.year,
            image: pm.movie.image,
            imageMedium: pm.movie.imageMedium,
          })),
          votes: [],
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
