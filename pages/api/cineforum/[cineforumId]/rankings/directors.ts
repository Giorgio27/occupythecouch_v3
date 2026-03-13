import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

type DirectorMovie = {
  title: string;
  average_rating: number;
};

type DirectorRanking = {
  name: string;
  count: number;
  average_rating: number;
  movies: DirectorMovie[];
};

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

    // Fetch all movie round rankings for this cineforum with movie details
    const rankings = await prisma.movieRoundRanking.findMany({
      where: {
        round: {
          cineforumId,
        },
        averageRating: {
          not: null,
        },
      },
      include: {
        movie: {
          select: {
            title: true,
            director: true,
          },
        },
      },
    });

    // Group by director and calculate statistics
    const directorsMap: Record<string, DirectorRanking> = {};

    for (const ranking of rankings) {
      const director = ranking.movie.director;

      // Skip if no director
      if (!director) continue;

      // Initialize director entry if not exists
      if (!directorsMap[director]) {
        directorsMap[director] = {
          name: director,
          count: 0,
          average_rating: 0,
          movies: [],
        };
      }

      // Add movie to director's list
      directorsMap[director].count += 1;
      directorsMap[director].movies.push({
        title: ranking.movie.title,
        average_rating: ranking.averageRating || 0,
      });
    }

    // Calculate average rating for each director
    for (const director of Object.values(directorsMap)) {
      const totalRating = director.movies.reduce(
        (sum, movie) => sum + movie.average_rating,
        0,
      );
      director.average_rating = parseFloat(
        (totalRating / director.count).toFixed(2),
      );
    }

    // Convert to array and return
    const body = Object.values(directorsMap);

    return res.status(200).json({
      body,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching directors rankings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
