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
        movie: {
          select: {
            title: true,
          },
        },
        round: {
          select: {
            name: true,
          },
        },
        movieRoundRanking: {
          select: {
            averageRating: true,
            roundWinner: true,
          },
        },
      },
    });

    // Calculate consensus deviation metrics
    const votesWithConsensus = userVotes.filter(
      (v) => v.movieRoundRanking?.averageRating !== null,
    );

    // Get most deviant movies (top 10)
    const voteDetails = votesWithConsensus.map((v) => ({
      movie: v.movie.title,
      round: v.round.name,
      user_rating: v.rating,
      movie_average: v.movieRoundRanking!.averageRating!,
      deviation: Math.abs(v.rating - v.movieRoundRanking!.averageRating!),
      round_winner: v.movieRoundRanking?.roundWinner || false,
    }));

    const mostDeviantMovies = [...voteDetails]
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 10);

    return res.status(200).json({
      body: mostDeviantMovies,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching most deviant movies:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
