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

    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all user's votes in this cineforum with movie round ranking info
    const userVotes = await prisma.movieVote.findMany({
      where: {
        userId,
        round: {
          cineforumId,
          closed: true,
        },
      },
      include: {
        movieRoundRanking: {
          select: {
            averageRating: true,
          },
        },
      },
    });

    // Calculate global average across all users in this cineforum
    const allVotesInCineforum = await prisma.movieVote.findMany({
      where: {
        round: {
          cineforumId,
          closed: true,
        },
      },
      select: {
        rating: true,
      },
    });

    const globalAverage =
      allVotesInCineforum.length > 0
        ? allVotesInCineforum.reduce((sum, v) => sum + v.rating, 0) /
          allVotesInCineforum.length
        : null;

    // Calculate user statistics
    const totalVotes = userVotes.length;
    const userAverage =
      totalVotes > 0
        ? userVotes.reduce((sum, v) => sum + v.rating, 0) / totalVotes
        : null;

    const deltaFromGlobal =
      userAverage !== null && globalAverage !== null
        ? userAverage - globalAverage
        : null;

    // Calculate standard deviation
    let standardDeviation: number | null = null;
    if (totalVotes > 1 && userAverage !== null) {
      const variance =
        userVotes.reduce(
          (sum, v) => sum + Math.pow(v.rating - userAverage, 2),
          0,
        ) / totalVotes;
      standardDeviation = Math.sqrt(variance);
    }

    // Calculate consensus deviation metrics
    const votesWithConsensus = userVotes.filter(
      (v) => v.movieRoundRanking?.averageRating !== null,
    );

    let averageDeviationFromConsensus: number | null = null;
    let aboveConsensusCount = 0;
    let belowConsensusCount = 0;

    if (votesWithConsensus.length > 0) {
      const deviations = votesWithConsensus.map((v) => {
        const movieAvg = v.movieRoundRanking!.averageRating!;
        const deviation = v.rating - movieAvg;

        if (deviation > 0) aboveConsensusCount++;
        else if (deviation < 0) belowConsensusCount++;

        return Math.abs(deviation);
      });

      averageDeviationFromConsensus =
        deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    }

    const aboveConsensusPercentage =
      votesWithConsensus.length > 0
        ? (aboveConsensusCount / votesWithConsensus.length) * 100
        : null;

    const belowConsensusPercentage =
      votesWithConsensus.length > 0
        ? (belowConsensusCount / votesWithConsensus.length) * 100
        : null;

    const body = {
      user_id: targetUser.id,
      user_name: targetUser.name || "Unknown",
      total_votes: totalVotes,
      average_rating: userAverage,
      global_average: globalAverage,
      delta_from_global: deltaFromGlobal,
      standard_deviation: standardDeviation,
      average_deviation_from_consensus: averageDeviationFromConsensus,
      above_consensus_percentage: aboveConsensusPercentage,
      below_consensus_percentage: belowConsensusPercentage,
    };

    return res.status(200).json({
      body,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching user profile statistics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
