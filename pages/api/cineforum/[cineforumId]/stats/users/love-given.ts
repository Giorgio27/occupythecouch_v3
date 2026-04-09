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

    // Love given (how target user voted for others' movies)
    const movieVotesByTargetUser = await prisma.movieVote.findMany({
      where: {
        userId,
        round: {
          cineforumId,
          closed: true,
        },
      },
      select: {
        movieId: true,
        rating: true,
        movieRoundRanking: {
          select: {
            averageRating: true,
            userId: true,
          },
        },
      },
    });

    const targetUserGivenVotes: Record<string, { userVotes: number[] }> = {};
    for (const movieVote of movieVotesByTargetUser) {
      if (!movieVote.movieRoundRanking) continue;
      const movieOwner = movieVote.movieRoundRanking.userId;
      if (!movieOwner) continue;
      if (!targetUserGivenVotes[movieOwner]) {
        targetUserGivenVotes[movieOwner] = { userVotes: [] };
      }
      targetUserGivenVotes[movieOwner].userVotes.push(movieVote.rating);
    }

    // Get all user rankings to fetch averageRating for each user
    const allUserRankings = await prisma.userRanking.findMany({
      where: {
        cineforumId,
        userId: {
          in: Object.keys(targetUserGivenVotes),
        },
      },
      select: {
        userId: true,
        averageRating: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const userRankingMap = new Map(
      allUserRankings.map((ur) => [ur.userId, ur]),
    );

    const loveGiven = Object.entries(targetUserGivenVotes).map(
      ([otherUserId, { userVotes }]) => {
        const averageGiven =
          userVotes.reduce((sum, v) => sum + v, 0) / userVotes.length;
        const userRanking = userRankingMap.get(otherUserId);
        return {
          userId: otherUserId,
          userName: userRanking?.user.name || "Unknown",
          averageVote: averageGiven,
          averageRanking: userRanking?.averageRating || null,
          count: userVotes.length,
        };
      },
    );

    return res.status(200).json({
      body: loveGiven,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching love given statistics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
