// API route: POST /api/cineforum/[cineforumId]/oscars/vote
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId } = req.query;
  if (typeof cineforumId !== "string") {
    return res.status(400).json({ error: "Invalid cineforumId" });
  }

  const { roundId, movieId, rating } = req.body;

  if (!roundId || !movieId || typeof rating !== "number") {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (rating < 0 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 0 and 5" });
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

  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Not a member of this cineforum" });
  }

  try {
    // Verify round belongs to cineforum
    const round = await prisma.round.findFirst({
      where: {
        id: roundId,
        cineforumId,
      },
    });

    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }

    // Check if round is closed
    if (round.closed) {
      return res.status(400).json({ error: "Cannot vote on a closed round" });
    }

    // Upsert the vote
    const vote = await prisma.movieVote.upsert({
      where: {
        roundId_movieId_userId: {
          roundId,
          movieId,
          userId: session.user.id,
        },
      },
      update: {
        rating,
      },
      create: {
        roundId,
        movieId,
        userId: session.user.id,
        rating,
      },
    });

    // Fetch updated round data (similar to Rails serialize)
    const updatedRound = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        chooser: {
          select: {
            id: true,
            name: true,
          },
        },
        proposals: {
          where: {
            winnerId: { not: null },
          },
          orderBy: {
            date: "asc",
          },
          include: {
            winner: true,
            ownerUser: {
              select: {
                id: true,
                name: true,
              },
            },
            ownerTeam: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!updatedRound) {
      return res.status(404).json({ error: "Round not found" });
    }

    // Transform to match Rails format
    const winners = await Promise.all(
      updatedRound.proposals
        .filter((p) => p.winner)
        .map(async (proposal) => {
          const movie = proposal.winner!;

          const votes = await prisma.movieVote.findMany({
            where: {
              roundId: updatedRound.id,
              movieId: movie.id,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          const roundRating =
            votes.length > 0
              ? votes.reduce((sum, v) => sum + v.rating, 0) / votes.length
              : null;

          const proposer = proposal.ownerTeam
            ? proposal.ownerTeam.name
            : proposal.ownerUser?.name || "Unknown";

          return {
            id: movie.id,
            title: movie.title,
            year: movie.year,
            actors:
              typeof movie.actors === "string"
                ? movie.actors
                : Array.isArray(movie.actors)
                  ? movie.actors.join(", ")
                  : "",
            image: movie.image,
            imageMedium: movie.imageMedium,
            poster: movie.poster,
            overview: movie.overview,
            roundRating: roundRating
              ? Math.round(roundRating * 100) / 100
              : null,
            roundVotes: votes.map((v) => ({
              user: v.user.id,
              userName: v.user.name,
              rating: v.rating,
            })),
            userRating:
              votes.find((v) => v.user.id === session.user.id)?.rating || null,
            proposer,
          };
        }),
    );

    const sortedWinners = [...winners].sort(
      (a, b) => (b.roundRating || 0) - (a.roundRating || 0),
    );
    const bestRating = sortedWinners[0]?.roundRating;
    const bests = sortedWinners.filter((w) => w.roundRating === bestRating);

    const response = {
      id: updatedRound.id,
      name: updatedRound.name,
      closed: updatedRound.closed,
      date: updatedRound.date
        ? new Date(updatedRound.date).toLocaleDateString("it-IT")
        : null,
      chooser: updatedRound.chooser
        ? {
            id: updatedRound.chooser.id,
            name: updatedRound.chooser.name,
          }
        : null,
      winners,
      bests: bests.map((b) => ({
        id: b.id,
        title: b.title,
        proposer: b.proposer,
        roundRating: b.roundRating,
      })),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error creating movie vote:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
