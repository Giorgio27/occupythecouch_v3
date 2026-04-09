import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { cineforumId, userId } = req.query;

    if (typeof cineforumId !== "string") {
      return res.status(400).json({ error: "Invalid cineforumId" });
    }

    if (typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_cineforumId: {
          userId: session.user.id,
          cineforumId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Not a member of this cineforum" });
    }

    // Get all user's votes in this cineforum
    const userVotes = await prisma.movieVote.findMany({
      where: {
        userId,
        round: {
          cineforumId,
          closed: true,
        },
      },
      select: {
        rating: true,
      },
    });

    // Calculate rating distribution
    const distributionMap = new Map<number, number>();
    for (let i = 0; i <= 5; i += 0.5) {
      distributionMap.set(i, 0);
    }

    userVotes.forEach((v) => {
      const rounded = Math.round(v.rating * 2) / 2; // Round to nearest 0.5
      distributionMap.set(rounded, (distributionMap.get(rounded) || 0) + 1);
    });

    const ratingDistribution = Array.from(distributionMap.entries())
      .map(([rating, count]) => ({ rating, count }))
      .filter((d) => d.count > 0)
      .sort((a, b) => a.rating - b.rating);

    return res.status(200).json({
      body: ratingDistribution,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching rating distribution:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
