import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

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
      return res.status(200).json(null);
    }

    // Transform proposal to match ProposalDetailDTO
    const serializedProposal = {
      id: proposal.id,
      date: proposal.date?.toISOString() || null,
      title: proposal.title,
      description: proposal.description,
      closed: proposal.closed,
      show_results: proposal.showResults,
      round: proposal.round?.name || null,
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
    };

    return res.status(200).json(serializedProposal);
  } catch (error) {
    console.error("GET last proposal error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
