import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

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
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await prisma.proposal.count({
      where: { cineforumId },
    });

    // Fetch proposals with pagination
    const proposals = await prisma.proposal.findMany({
      where: { cineforumId },
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        movies: { include: { movie: true } },
        round: true,
        ownerUser: true,
        ownerTeam: true,
        winner: true,
      },
    });

    // Transform proposals to match ProposalDetailDTO
    const serializedProposals = proposals.map((proposal) => ({
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
        ? { id: proposal.ownerUserId, type: "User" as const }
        : { id: proposal.ownerTeamId!, type: "Team" as const },
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
    }));

    return res.status(200).json({
      proposals: serializedProposals,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: skip + proposals.length < totalCount,
      },
    });
  } catch (error) {
    console.error("GET proposals error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
