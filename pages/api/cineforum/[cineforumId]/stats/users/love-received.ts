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

    const enabledUsers = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            cineforumId,
            disabled: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // get target user proposed movies (movies proposed by target user)
    const targetUserMovieRoundRankings =
      await prisma.movieRoundRanking.findMany({
        where: {
          userId,
          round: {
            cineforumId,
            closed: true,
          },
        },
        select: {
          movieId: true,
          movieVotes: true,
          averageRating: true,
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
        },
        orderBy: {
          round: {
            name: "asc",
          },
        },
      });

    // for each move round rankings i should put its votes in a map of userId to votes, so that I can calculate love received for each user
    const userVotesMap: Record<
      string,
      {
        rating: number;
        movieTitle: string;
        movieAverageVote: number;
        round: string;
      }[]
    > = {};
    targetUserMovieRoundRankings.forEach((ranking) => {
      ranking.movieVotes.forEach((vote) => {
        if (!userVotesMap[vote.userId]) {
          userVotesMap[vote.userId] = [];
        }
        userVotesMap[vote.userId].push({
          rating: vote.rating,
          movieTitle: ranking.movie.title,
          movieAverageVote: ranking.averageRating,
          round: ranking.round.name,
        });
      });
    });

    const loveReceived = Object.entries(userVotesMap)
      .map(([userId, votes]) => {
        const userName = enabledUsers.find((u) => u.id === userId)?.name;
        if (!userName) {
          return null; // Skip users who are not enabled in this cineforum
        }
        const averageVote =
          votes.reduce((sum, v) => sum + v.rating, 0) / votes.length;

        // whould be nice also to return all the votes from the user for each film
        return {
          userId,
          userName,
          averageVote,
          count: votes.length,
          votes,
        };
      })
      .filter((v) => v !== null);

    return res.status(200).json({
      body: loveReceived,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching love received statistics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
