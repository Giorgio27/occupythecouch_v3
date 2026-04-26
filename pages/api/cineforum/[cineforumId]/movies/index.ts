import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import type { MovieStatsDTO } from "@/lib/shared/types";

type MovieStatsAccumulator = MovieStatsDTO & {
  _winningRoundName: string | null;
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
      where: { cineforumId },
      include: {
        round: {
          select: { id: true, name: true },
        },
        movies: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                imageMedium: true,
                image: true,
                poster: true,
                imdbId: true,
                year: true,
                overview: true,
                director: true,
                genres: true,
              },
            },
          },
        },
        winner: {
          select: { id: true },
        },
      },
    });

    // Aggregate movie statistics
    const moviesMap: Record<string, MovieStatsAccumulator> = {};

    for (const proposal of proposals) {
      const winnerId = proposal.winner?.id ?? null;
      const roundName = proposal.round?.name ?? null;

      for (const proposalMovie of proposal.movies) {
        const movie = proposalMovie.movie;
        const movieId = movie.id;

        // Parse genres from JSONB (stored as string[] or {name: string}[])
        let genres: string[] = [];
        if (Array.isArray(movie.genres)) {
          genres = (movie.genres as unknown[])
            .map((g) =>
              typeof g === "string" ? g : ((g as { name?: string }).name ?? ""),
            )
            .filter(Boolean);
        }

        if (!moviesMap[movieId]) {
          moviesMap[movieId] = {
            id: movieId,
            title: movie.title,
            proposals: 0,
            wins: 0,
            defeats: 0,
            imageMedium: movie.imageMedium ?? null,
            image: movie.image ?? null,
            poster: movie.poster ?? null,
            imdbId: movie.imdbId ?? null,
            year: movie.year ?? null,
            overview: movie.overview ?? null,
            director: movie.director ?? null,
            genres,
            round_name: null,
            _winningRoundName: null,
          };
        }

        moviesMap[movieId].proposals += 1;

        if (winnerId === movieId) {
          moviesMap[movieId].wins += 1;
          moviesMap[movieId]._winningRoundName = roundName;
        }
      }
    }

    // Build final array
    const body: MovieStatsDTO[] = Object.values(moviesMap).map((m) => {
      const { _winningRoundName, ...rest } = m;
      return {
        ...rest,
        defeats: rest.proposals - rest.wins,
        round_name: _winningRoundName,
      };
    });

    return res.status(200).json({ body, status: "completed" });
  } catch (error) {
    console.error("Error fetching movies:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
