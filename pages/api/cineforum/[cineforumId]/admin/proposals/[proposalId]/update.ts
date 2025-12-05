import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end();
  }

  const { cineforumId, proposalId } = req.query;
  const { show_results } = req.body;

  if (!cineforumId || typeof cineforumId !== "string") {
    return res.status(400).json({ error: "cineforumId is required" });
  }

  if (!proposalId || typeof proposalId !== "string") {
    return res.status(400).json({ error: "proposalId is required" });
  }

  // Check if current user is admin or owner of this cineforum
  const currentUserMembership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: (session.user as any).id,
        cineforumId,
      },
    },
  });

  if (
    !currentUserMembership ||
    !["ADMIN", "OWNER"].includes(currentUserMembership.role)
  ) {
    return res.status(403).json({
      error: "You must be an admin or owner to update proposals",
    });
  }

  try {
    // Verify the proposal exists and belongs to the cineforum
    const existingProposal = await prisma.proposal.findUnique({
      where: {
        id: proposalId,
        cineforumId,
      },
      include: {
        movies: {
          include: { movie: true },
        },
        ownerUser: true,
        ownerTeam: true,
        winner: true,
      },
    });

    if (!existingProposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    // Prepare update data
    const updateData: Prisma.ProposalUpdateInput = {
      showResults: show_results,
    };

    // Update the proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
      include: {
        movies: {
          include: { movie: true },
        },
        ownerUser: true,
        ownerTeam: true,
        winner: true,
      },
    });

    // Transform proposal to match Ruby serialization
    const serializedProposal = {
      id: updatedProposal.id,
      date: updatedProposal.date,
      title: updatedProposal.title,
      description: updatedProposal.description,
      closed: updatedProposal.closed,
      show_results: updatedProposal.showResults,
      round_id: updatedProposal.roundId,
      winner: updatedProposal.winner,
      owner: updatedProposal.ownerUserId
        ? {
            id: updatedProposal.ownerUserId,
            type: "User" as const,
            name: updatedProposal.ownerUser?.name,
          }
        : {
            id: updatedProposal.ownerTeamId!,
            type: "Team" as const,
            name: updatedProposal.ownerTeam?.name,
          },
      movies: updatedProposal.movies.map((pm) => pm.movie),
    };

    return res.status(200).json(serializedProposal);
  } catch (error) {
    console.error("Update proposal error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
