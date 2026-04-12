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
            team: true,
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
        },
      },
    });

    const targetUserGivenVotes: Record<
      string,
      {
        userVotes: number[];
        votes: {
          rating: number;
          movieTitle: string;
          movieAverageVote: number;
          round: string;
        }[];
      }
    > = {};
    for (const movieVote of movieVotesByTargetUser) {
      if (!movieVote.movieRoundRanking) continue;
      // get the owner of the movie: if no user Id should search for all users in the team and add the vote to each of them
      let movieOwner = movieVote.movieRoundRanking.userId;
      const voteDetail = {
        rating: movieVote.rating,
        movieTitle: movieVote.movieRoundRanking.movie.title,
        movieAverageVote: movieVote.movieRoundRanking.averageRating,
        round: movieVote.movieRoundRanking.round.name,
      };

      if (movieOwner) {
        if (!targetUserGivenVotes[movieOwner]) {
          targetUserGivenVotes[movieOwner] = { userVotes: [], votes: [] };
        }
        targetUserGivenVotes[movieOwner].userVotes.push(movieVote.rating);
        targetUserGivenVotes[movieOwner].votes.push(voteDetail);
      } else if (!movieOwner && movieVote.movieRoundRanking.team) {
        const teamMembers = await prisma.teamUser.findMany({
          where: {
            teamId: movieVote.movieRoundRanking.team.id,
          },
          select: {
            userId: true,
          },
        });
        for (const member of teamMembers) {
          if (!targetUserGivenVotes[member.userId]) {
            targetUserGivenVotes[member.userId] = { userVotes: [], votes: [] };
          }

          targetUserGivenVotes[member.userId].userVotes.push(movieVote.rating);
          targetUserGivenVotes[member.userId].votes.push(voteDetail);
        }
      } else {
        continue;
      }
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

    const loveGiven = Object.entries(targetUserGivenVotes)
      .map(([otherUserId, { userVotes, votes }]) => {
        const userName = enabledUsers.find((u) => u.id === otherUserId)?.name;
        if (!userName) {
          return null; // Skip users who are not enabled in this cineforum
        }
        const averageGiven =
          userVotes.reduce((sum, v) => sum + v, 0) / userVotes.length;
        const userRanking = userRankingMap.get(otherUserId);
        return {
          userId: otherUserId,
          userName,
          averageVote: averageGiven,
          averageRanking: userRanking?.averageRating || null,
          count: userVotes.length,
          votes,
        };
      })
      .filter((v) => v !== null);

    return res.status(200).json({
      body: loveGiven,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching love given statistics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
