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

    // Fetch all closed proposals that have a winner movie
    const proposals = await prisma.proposal.findMany({
      where: {
        cineforumId,
        closed: true,
        winnerId: { not: null },
      },
      include: {
        winner: {
          select: {
            id: true,
            title: true,
            year: true,
            releaseDate: true,
            poster: true,
            director: true,
            genres: true,
          },
        },
        round: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
      },
      orderBy: [{ round: { date: "asc" } }, { date: "asc" }],
    });

    // Build year distribution
    const yearMap = new Map<
      number,
      {
        year: number;
        count: number;
        movies: {
          id: string;
          title: string;
          director: string | null;
          round: string;
          roundDate: string | null;
          poster: string | null;
          genres: unknown;
        }[];
      }
    >();

    for (const proposal of proposals) {
      if (!proposal.winner) continue;

      const movie = proposal.winner;
      // Prefer explicit year field, fall back to releaseDate year
      const year =
        movie.year ??
        (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null);

      if (!year) continue;

      if (!yearMap.has(year)) {
        yearMap.set(year, { year, count: 0, movies: [] });
      }

      const entry = yearMap.get(year)!;
      entry.count += 1;
      entry.movies.push({
        id: movie.id,
        title: movie.title,
        director: movie.director,
        round: proposal.round.name,
        roundDate: proposal.round.date
          ? proposal.round.date.toISOString()
          : null,
        poster: movie.poster,
        genres: movie.genres,
      });
    }

    // Sort by year ascending
    const body = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

    return res.status(200).json({ body, status: "completed" });
  } catch (error) {
    console.error("Error fetching timeline rankings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
