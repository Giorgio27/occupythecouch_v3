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
    const totalCount = await prisma.userRanking.count({
      where: {
        cineforumId,
      },
    });

    // Fetch user rankings ordered by average rating
    const rankings = await prisma.userRanking.findMany({
      where: {
        cineforumId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        movieRoundRankings: {
          include: {
            movieRoundRanking: {
              include: {
                movie: true,
                round: true,
              },
            },
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
      const movieRoundRankings = ranking.movieRoundRankings.map((urm) => {
        const mrr = urm.movieRoundRanking;

        // Calculate supplier votes (normalized to /5 scale)
        const supplierVote = (value: number | null | undefined) => {
          if (!value) return null;
          return parseFloat((value / 2.0).toFixed(2));
        };

        return {
          average_rating: mrr.averageRating,
          movie: mrr.movie.title,
          round_winner: mrr.roundWinner,
          round: mrr.round.name,
          tmdb_vote: supplierVote(mrr.movie.voteAverage),
          imdb_rating: supplierVote(mrr.movie.imdbRating),
          tomatometer: supplierVote(mrr.movie.tomatometer),
          metascore: supplierVote(mrr.movie.metascore),
        };
      });

      return {
        id: ranking.id,
        average_rating: ranking.averageRating,
        imdb_rating: ranking.averageImdbRating,
        tmdb_vote: ranking.averageTmdbRating,
        tomatometer: ranking.averageRotoRating,
        metascore: ranking.averageMetaRating,
        movie_round_rankings: movieRoundRankings,
        user: ranking.user.name,
        user_id: ranking.user.id,
      };
    });

    const status = offset + limit >= totalCount ? "completed" : "progress";

    return res.status(200).json({
      body,
      status,
    });
  } catch (error) {
    console.error("Error fetching user rankings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
