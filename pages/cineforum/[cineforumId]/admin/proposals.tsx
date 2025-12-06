import { useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import { ProposalDetailDTO } from "@/lib/shared/types/cineforum";
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

interface AdminProposalsPageProps {
  initialProposal: ProposalDetailDTO | null;
}

export default function AdminProposalsPage({
  initialProposal,
}: AdminProposalsPageProps) {
  const router = useRouter();
  const { cineforumId } = router.query;
  const { isAdmin, isLoading } = useAdminAccess(cineforumId as string);

  const [proposal, setProposal] = useState<ProposalDetailDTO | null>(
    initialProposal
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefreshProposal = async () => {
    if (!cineforumId) return;

    setLoading(true);
    setError(null);
    try {
      const refreshedProposal = await adminProposalsClient.getLastProposal(
        cineforumId as string
      );
      setProposal(refreshedProposal);
    } catch (err) {
      setError("Failed to refresh proposal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseProposal = async () => {
    if (!proposal || !cineforumId) return;

    const winnerId = window.prompt("Enter the winner movie ID:");
    if (!winnerId) return;

    setLoading(true);
    setError(null);
    try {
      const closedProposal = await adminProposalsClient.closeProposal(
        cineforumId as string,
        proposal.id,
        winnerId
      );
      setProposal(closedProposal);
    } catch (err) {
      setError("Failed to close proposal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResults = async () => {
    if (!proposal || !cineforumId) return;

    setLoading(true);
    setError(null);
    try {
      const updatedProposal = await adminProposalsClient.updateProposal(
        cineforumId as string,
        proposal.id,
        { show_results: !proposal.show_results }
      );
      setProposal(updatedProposal);
    } catch (err) {
      setError("Failed to update proposal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Proposals admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the last proposal for this cineforum: close it, toggle
            results visibility.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshProposal}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? "Refreshing..." : "Refresh Proposal"}
          </Button>
        </div>

        {/* Proposal details */}
        {proposal ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{proposal.title}</CardTitle>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    proposal.closed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}
                >
                  {proposal.closed ? "Closed" : "Open"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Proposal info */}
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {proposal.date
                      ? new Date(proposal.date).toLocaleDateString()
                      : "No date"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Round:</span>
                  <span className="font-medium">{proposal.round || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="font-medium">
                    {proposal.owner?.type} - {proposal.owner?.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Show Results:</span>
                  <span className="font-medium">
                    {proposal.show_results ? "Yes" : "No"}
                  </span>
                </div>
                {proposal.winner && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Winner:</span>
                    <span className="font-medium">{proposal.winner.title}</span>
                  </div>
                )}
              </div>

              {proposal.description && (
                <div className="rounded-md border bg-muted/50 p-3 text-sm">
                  <p className="text-muted-foreground">
                    {proposal.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={proposal.closed ? "cursor-not-allowed" : ""}
                      >
                        <Button
                          onClick={handleCloseProposal}
                          disabled={loading || proposal.closed}
                          variant={proposal.closed ? "outline" : "default"}
                          size="sm"
                        >
                          {loading ? "Closing..." : "Close Proposal"}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {proposal.closed
                        ? "Proposal is already closed"
                        : "Close the proposal and select a winner"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleToggleResults}
                        disabled={loading}
                        variant={
                          proposal.show_results ? "secondary" : "default"
                        }
                        size="sm"
                      >
                        {loading
                          ? "Updating..."
                          : proposal.show_results
                          ? "Hide Results"
                          : "Show Results"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Toggle visibility of proposal results
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Movies */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold">Movies</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {proposal.movies.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex flex-col gap-2 rounded-md border bg-card p-3"
                    >
                      {movie.image && (
                        <img
                          src={movie.imageMedium}
                          alt={movie.title}
                          className="h-auto w-full rounded object-cover"
                        />
                      )}
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{movie.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Year: {movie.year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No active proposal found.
              </p>
            </CardContent>
          </Card>
        )}
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

  // Fetch the last proposal for this cineforum
  const lastProposal = await prisma.proposal.findFirst({
    where: { cineforumId },
    orderBy: { date: "desc" },
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
      initialProposal: lastProposal
        ? {
            id: lastProposal.id,
            date: lastProposal.date?.toISOString() || null,
            title: lastProposal.title,
            description: lastProposal.description,
            closed: lastProposal.closed,
            show_results: lastProposal.showResults,
            round: lastProposal.round?.name || null,
            winner: lastProposal.winner
              ? {
                  id: lastProposal.winner.id,
                  title: lastProposal.winner.title,
                  year: lastProposal.winner.year,
                  image: lastProposal.winner.image,
                }
              : null,
            owner: lastProposal.ownerUserId
              ? { id: lastProposal.ownerUserId, type: "User" }
              : { id: lastProposal.ownerTeamId!, type: "Team" },
            movies: lastProposal.movies.map((pm) => ({
              id: pm.movie.id,
              title: pm.movie.title,
              year: pm.movie.year,
              image: pm.movie.image,
              imageMedium: pm.movie.imageMedium,
            })),
            votes: [], // Not used in this view
            created_at: lastProposal.createdAt.toISOString(),
            missing_users: [], // Not used in this view
            no_votes_left: false, // Not used in this view
          }
        : null,
    },
  };
};
