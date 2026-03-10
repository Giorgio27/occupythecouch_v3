import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { cineforumId, proposalId } = req.query;

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
      error: "You must be an admin or owner to reopen proposals",
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
        round: true,
      },
    });

    if (!existingProposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    if (!existingProposal.closed) {
      return res.status(400).json({ error: "Proposal is already open" });
    }

    // Check if the round is still open
    if (existingProposal.round && existingProposal.round.closed) {
      return res
        .status(400)
        .json({ error: "Cannot reopen proposal: round is closed" });
    }

    // Reopen the proposal by setting closed to false and removing the winner
    const reopenedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        closed: false,
        winnerId: null,
      },
      include: {
        movies: {
          include: { movie: true },
        },
        ownerUser: true,
        ownerTeam: true,
        winner: true,
        round: true,
        votes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform proposal to match DTO
    const serializedProposal = {
      id: reopenedProposal.id,
      date: reopenedProposal.date?.toISOString() || null,
      title: reopenedProposal.title,
      description: reopenedProposal.description,
      closed: reopenedProposal.closed,
      show_results: reopenedProposal.showResults,
      round: reopenedProposal.round?.name || null,
      roundId: reopenedProposal.roundId,
      winner: reopenedProposal.winner
        ? {
            id: reopenedProposal.winner.id,
            title: reopenedProposal.winner.title,
            year: reopenedProposal.winner.year,
            image: reopenedProposal.winner.image,
          }
        : null,
      owner: reopenedProposal.ownerUserId
        ? {
            id: reopenedProposal.ownerUserId,
            type: "User" as const,
            name: reopenedProposal.ownerUser?.name || null,
          }
        : {
            id: reopenedProposal.ownerTeamId!,
            type: "Team" as const,
            name: reopenedProposal.ownerTeam?.name || null,
          },
      movies: reopenedProposal.movies.map((pm) => ({
        id: pm.movie.id,
        title: pm.movie.title,
        year: pm.movie.year,
        image: pm.movie.image,
        imageMedium: pm.movie.imageMedium,
      })),
      votes: reopenedProposal.votes.map((v) => ({
        id: v.id,
        user: {
          id: v.user.id,
          name: v.user.name,
        },
        movie_selection: v.movieSelection as Record<string, string[]>,
      })),
      created_at: reopenedProposal.createdAt.toISOString(),
      missing_users: [],
      no_votes_left: false,
    };

    return res.status(200).json(serializedProposal);
  } catch (error) {
    console.error("Reopen proposal error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
