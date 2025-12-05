import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
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
  const { isAdmin } = useAdminAccess(cineforumId as string);

  const [proposal, setProposal] = useState<ProposalDetailDTO | null>(
    initialProposal
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.push(`/cineforum/${cineforumId}`);
    }
  }, [isAdmin, cineforumId, router]);

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

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Proposals</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="flex space-x-4 mb-4">
        <Button onClick={handleRefreshProposal} disabled={loading}>
          Refresh Proposal
        </Button>
      </div>

      {proposal ? (
        <Card>
          <CardHeader>
            <CardTitle>{proposal.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Date:</strong> {proposal.date}
                </p>
                <p>
                  <strong>Description:</strong> {proposal.description}
                </p>
                <p>
                  <strong>Status:</strong> {proposal.closed ? "Closed" : "Open"}
                </p>
                <p>
                  <strong>Round:</strong> {proposal.round}
                </p>
              </div>
              <div>
                <p>
                  <strong>Owner:</strong> {proposal.owner?.type} -{" "}
                  {proposal.owner?.id}
                </p>
                <p>
                  <strong>Show Results:</strong>{" "}
                  {proposal.show_results ? "Yes" : "No"}
                </p>
                {proposal.winner && (
                  <p>
                    <strong>Winner:</strong> {proposal.winner.title}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCloseProposal}
                      disabled={loading || proposal.closed}
                      variant={proposal.closed ? "outline" : "default"}
                    >
                      Close Proposal
                    </Button>
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
                        proposal.show_results ? "destructive" : "default"
                      }
                    >
                      {proposal.show_results ? "Hide Results" : "Show Results"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Toggle visibility of proposal results
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Movies</h3>
              <div className="grid grid-cols-3 gap-4">
                {proposal.movies.map((movie) => (
                  <div key={movie.id} className="border p-2 rounded">
                    <p>
                      <strong>{movie.title}</strong>
                    </p>
                    <p>Year: {movie.year}</p>
                    {movie.image && (
                      <img
                        src={movie.image}
                        alt={movie.title}
                        className="w-full h-auto mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p>No active proposal found.</p>
      )}
    </div>
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
