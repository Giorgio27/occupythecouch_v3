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

    const { cineforumId } = req.query;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    if (typeof cineforumId !== "string") {
      return res.status(400).json({ error: "Invalid cineforumId" });
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

    // Get total count for pagination status
    const totalCount = await prisma.movieRoundRanking.count({
      where: {
        round: {
          cineforumId,
        },
      },
    });

    // Fetch movie rankings ordered by average rating
    const rankings = await prisma.movieRoundRanking.findMany({
      where: {
        round: {
          cineforumId,
        },
      },
      include: {
        movie: true,
        round: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        movieVotes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            rating: "desc",
          },
        },
      },
      orderBy: [
        {
          averageRating: "desc",
        },
        {
          id: "asc",
        },
      ],
      skip: offset,
      take: limit,
    });

    // Transform to match the Ruby API response format
    const body = rankings.map((ranking) => {
      const owner = ranking.user || ranking.team;

      // Calculate supplier votes (normalized to /5 scale like Ruby)
      const supplierVote = (value: number | null | undefined) => {
        if (!value) return null;
        return parseFloat((value / 2.0).toFixed(2));
      };

      const voteDifference = (supplierValue: number | null) => {
        if (!supplierValue || !ranking.averageRating) return null;
        const diff = supplierValue - ranking.averageRating;
        return parseFloat(diff.toFixed(2));
      };

      const voteDifferenceToString = (diff: number | null) => {
        if (diff === null) return null;
        return diff >= 0 ? `+${diff}` : `${diff}`;
      };

      const tmdbVote = supplierVote(ranking.movie.voteAverage);
      const imdbRating = supplierVote(ranking.movie.imdbRating);
      const tomatometer = supplierVote(ranking.movie.tomatometer);
      const metascore = supplierVote(ranking.movie.metascore);

      return {
        id: ranking.id,
        average_rating: ranking.averageRating,
        movie: ranking.movie.title,
        movie_votes: ranking.movieVotes.map((vote) => ({
          id: vote.id,
          rating: vote.rating,
          user: vote.user.name,
        })),
        owner: owner?.name || "Unknown",
        round: ranking.round.name,
        round_winner: ranking.roundWinner,
        tmdb_vote: tmdbVote,
        imdb_rating: imdbRating,
        tomatometer,
        metascore,
        tmdb_difference: voteDifferenceToString(voteDifference(tmdbVote)),
        imdb_difference: voteDifferenceToString(voteDifference(imdbRating)),
        tomato_difference: voteDifferenceToString(voteDifference(tomatometer)),
        meta_difference: voteDifferenceToString(voteDifference(metascore)),
      };
    });

    const status = offset + limit >= totalCount ? "completed" : "progress";

    return res.status(200).json({
      body,
      status,
    });
  } catch (error) {
    console.error("Error fetching movie rankings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
