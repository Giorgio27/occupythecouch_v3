import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId } = req.query;
  if (!cineforumId || typeof cineforumId !== "string") {
    return res.status(400).json({ error: "cineforumId is required" });
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
      error: "You must be an admin or owner to access admin proposals",
    });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case "GET":
      return handleGetLastProposal(req, res, cineforumId);
    default:
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end();
  }
}

async function handleGetLastProposal(
  req: NextApiRequest,
  res: NextApiResponse,
  cineforumId: string
) {
  try {
    const proposal = await prisma.proposal.findFirst({
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

    if (!proposal) {
      return res.status(404).json({ error: "No proposals found" });
    }

    // Transform proposal to match Ruby serialization
    const serializedProposal = {
      id: proposal.id,
      date: proposal.date,
      title: proposal.title,
      description: proposal.description,
      closed: proposal.closed,
      show_results: proposal.showResults,
      round_id: proposal.roundId,
      winner: proposal.winner,
      owner: proposal.ownerUserId
        ? {
            id: proposal.ownerUserId,
            type: "User",
            name: proposal.ownerUser?.name,
          }
        : {
            id: proposal.ownerTeamId,
            type: "Team",
            name: proposal.ownerTeam?.name,
          },
      movies: proposal.movies.map((pm) => pm.movie),
    };

    return res.status(200).json(serializedProposal);
  } catch (error) {
    console.error("GET last proposal error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
