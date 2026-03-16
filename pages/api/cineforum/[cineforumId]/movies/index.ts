import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

type MovieStats = {
  id: string;
  title: string;
  proposals: number;
  wins: number;
  defeats: number;
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

    // Fetch all proposals with their movies for this cineforum
    const proposals = await prisma.proposal.findMany({
      where: {
        cineforumId,
      },
      include: {
        movies: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        winner: {
          select: {
            id: true,
          },
        },
      },
    });

    // Aggregate movie statistics
    const moviesMap: Record<string, MovieStats> = {};

    for (const proposal of proposals) {
      const winnerId = proposal.winner?.id;

      for (const proposalMovie of proposal.movies) {
        const movie = proposalMovie.movie;
        const movieId = movie.id;

        // Initialize movie entry if not exists
        if (!moviesMap[movieId]) {
          moviesMap[movieId] = {
            id: movieId,
            title: movie.title,
            proposals: 0,
            wins: 0,
            defeats: 0,
          };
        }

        // Increment proposals count
        moviesMap[movieId].proposals += 1;

        // Increment wins if this movie won this proposal
        if (winnerId === movieId) {
          moviesMap[movieId].wins += 1;
        }
      }
    }

    // Calculate defeats for each movie
    for (const movie of Object.values(moviesMap)) {
      movie.defeats = movie.proposals - movie.wins;
    }

    // Convert to array
    const body = Object.values(moviesMap);

    return res.status(200).json({
      body,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
