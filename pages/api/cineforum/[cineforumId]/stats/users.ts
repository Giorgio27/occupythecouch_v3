import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
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
      orderBy: {
        createdAt: "asc",
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

    // Calculate user-to-user comparisons
    // Get all other users who have voted in this cineforum
    const allUsers = await prisma.user.findMany({
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

    const userComparisons = [];

    // Love given (how target user voted for others) - prefetch all votes by target user to optimize
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
    const loveGiven = Object.entries(targetUserGivenVotes).map(
      ([otherUserId, { userVotes }]) => {
        const averageGiven =
          userVotes.reduce((sum, v) => sum + v, 0) / userVotes.length;
        return {
          otherUserId,
          averageGiven,
          count: userVotes.length,
        };
      },
    );

    // Love received (how others voted for target user) - prefetch all votes for target user's movies to optimize
    const movieVotesForTargetUser = await prisma.movieVote.findMany({
      where: {
        movieId: {
          in: userVotes.map((v) => v.movieId),
        },
        round: {
          cineforumId,
          closed: true,
        },
      },
      select: {
        rating: true,
        userId: true,
      },
    });
    const targetUserReceivedVotes: Record<string, { receivedVotes: number[] }> =
      {};
    for (const vote of movieVotesForTargetUser) {
      if (!targetUserReceivedVotes[vote.userId]) {
        targetUserReceivedVotes[vote.userId] = { receivedVotes: [] };
      }
      targetUserReceivedVotes[vote.userId].receivedVotes.push(vote.rating);
    }
    const loveReceived = Object.entries(targetUserReceivedVotes).map(
      ([userId, { receivedVotes }]) => {
        const averageReceived =
          receivedVotes.reduce((sum, v) => sum + v, 0) / receivedVotes.length;
        return {
          otherUserId: userId,
          averageReceived,
          count: receivedVotes.length,
        };
      },
    );
    // Get target user's movie IDs (movies voted by target user)
    const targetUserMovieIds = userVotes.map((v) => v.movieId);

    for (const otherUser of allUsers) {
      // Get other user's global average
      const allOtherUserVotes = await prisma.movieVote.findMany({
        where: {
          userId: otherUser.id,
          round: {
            cineforumId,
            closed: true,
          },
        },
        select: {
          rating: true,
        },
      });

      const otherUserGlobalAverage =
        allOtherUserVotes.length > 0
          ? allOtherUserVotes.reduce((sum, v) => sum + v.rating, 0) /
            allOtherUserVotes.length
          : null;

      // LOVE RECEIVED: How other user voted for target user's movies
      const otherUserVotesOnTargetMovies = await prisma.movieVote.findMany({
        where: {
          userId: otherUser.id,
          movieId: {
            in: targetUserMovieIds,
          },
          round: {
            cineforumId,
            closed: true,
          },
        },
        select: {
          rating: true,
        },
      });

      const receivedAverageFromOther =
        otherUserVotesOnTargetMovies.length > 0
          ? otherUserVotesOnTargetMovies.reduce((sum, v) => sum + v.rating, 0) /
            otherUserVotesOnTargetMovies.length
          : null;

      const receivedDeltaVsOtherAverage =
        receivedAverageFromOther !== null && otherUserGlobalAverage !== null
          ? receivedAverageFromOther - otherUserGlobalAverage
          : null;

      // LOVE GIVEN: How target user voted for other user's movies
      const otherUserVotes = await prisma.movieVote.findMany({
        where: {
          userId: otherUser.id,
          round: {
            cineforumId,
            closed: true,
          },
        },
        select: {
          movieId: true,
        },
      });

      const otherUserMovieIds = otherUserVotes.map((v) => v.movieId);

      const targetUserVotesOnOtherMovies = userVotes.filter((v) =>
        otherUserMovieIds.includes(v.movieId),
      );

      const givenAverageToOther =
        targetUserVotesOnOtherMovies.length > 0
          ? targetUserVotesOnOtherMovies.reduce((sum, v) => sum + v.rating, 0) /
            targetUserVotesOnOtherMovies.length
          : null;

      const givenDeltaVsOtherAverage =
        givenAverageToOther !== null && otherUserGlobalAverage !== null
          ? givenAverageToOther - otherUserGlobalAverage
          : null;

      // Only add if there's at least some interaction
      if (
        otherUserVotesOnTargetMovies.length > 0 ||
        targetUserVotesOnOtherMovies.length > 0
      ) {
        userComparisons.push({
          other_user_id: otherUser.id,
          other_user_name: otherUser.name || "Unknown",
          other_user_global_average: otherUserGlobalAverage,
          received_average_from_other: receivedAverageFromOther,
          received_delta_vs_other_average: receivedDeltaVsOtherAverage,
          received_movies_count: otherUserVotesOnTargetMovies.length,
          given_average_to_other: givenAverageToOther,
          given_delta_vs_other_average: givenDeltaVsOtherAverage,
          given_movies_count: targetUserVotesOnOtherMovies.length,
        });
      }
    }

    // Add self row (selected user voting their own movies)
    const selfVotesOnOwnMovies = userVotes.filter((v) =>
      targetUserMovieIds.includes(v.movieId),
    );

    const selfAverageOnOwnMovies =
      selfVotesOnOwnMovies.length > 0
        ? selfVotesOnOwnMovies.reduce((sum, v) => sum + v.rating, 0) /
          selfVotesOnOwnMovies.length
        : null;

    const selfDeltaVsOwnAverage =
      selfAverageOnOwnMovies !== null && userAverage !== null
        ? selfAverageOnOwnMovies - userAverage
        : null;

    userComparisons.unshift({
      other_user_id: targetUser.id,
      other_user_name: targetUser.name || "Unknown",
      other_user_global_average: userAverage,
      received_average_from_other: selfAverageOnOwnMovies,
      received_delta_vs_other_average: selfDeltaVsOwnAverage,
      received_movies_count: selfVotesOnOwnMovies.length,
      given_average_to_other: selfAverageOnOwnMovies,
      given_delta_vs_other_average: selfDeltaVsOwnAverage,
      given_movies_count: selfVotesOnOwnMovies.length,
    });

    // Sort by relevance (users with more interactions first, but keep self first)
    const selfRow = userComparisons.shift()!;
    userComparisons.sort(
      (a, b) =>
        Math.max(b.received_movies_count, b.given_movies_count) -
        Math.max(a.received_movies_count, a.given_movies_count),
    );
    userComparisons.unshift(selfRow);

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
      rating_distribution: ratingDistribution,
      most_deviant_movies: mostDeviantMovies,
      vote_details: voteDetails,
      user_comparisons: userComparisons,
    };

    return res.status(200).json({
      body,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
