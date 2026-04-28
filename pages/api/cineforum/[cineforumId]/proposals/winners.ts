import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export type ProposalWinnersDTO = {
  imdbIds: string[];
};

/**
 * GET /api/cineforum/[cineforumId]/proposals/winners
 * Returns the IMDb IDs of all movies that have won a proposal in this cineforum.
 */
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
  if (!cineforumId || typeof cineforumId !== "string") {
    return res.status(400).json({ error: "cineforumId is required" });
  }

  // Verify membership
  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: (session.user as any).id,
        cineforumId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    return res.status(403).json({ error: "Not a member of this cineforum" });
  }

  try {
    const proposals = await prisma.proposal.findMany({
      where: {
        cineforumId,
        closed: true,
        winnerId: { not: null },
      },
      select: {
        winner: {
          select: { imdbId: true, title: true, year: true },
        },
      },
    });

    const imdbIds = proposals
      .map((p) => p.winner?.imdbId)
      .filter((id): id is string => Boolean(id));

    return res.status(200).json({ imdbIds });
  } catch (error) {
    console.error("Error fetching proposal winners:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
