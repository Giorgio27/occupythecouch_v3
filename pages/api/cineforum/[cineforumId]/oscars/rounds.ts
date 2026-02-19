// API route: GET /api/cineforum/[cineforumId]/oscars/rounds
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
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
    const offset = parseInt((req.query.offset as string) || "0");
    const limit = parseInt((req.query.limit as string) || "5");

    // Fetch oscarable rounds with winners
    const rounds = await prisma.round.findMany({
      where: {
        cineforumId,
        oscarable: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
      include: {
        chooser: {
          select: {
            id: true,
            name: true,
            email: true,
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
            winner: {
              include: {
                movieVotes: {
                  where: {
                    roundId: undefined, // will be set per round
                  },
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
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
                users: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get total count for pagination status
    const totalCount = await prisma.round.count({
      where: {
        cineforumId,
        oscarable: true,
      },
    });

    // Transform data to match Rails format
    const body = await Promise.all(
      rounds.map(async (round) => {
        // Get all winners (movies) for this round
        const winners = await Promise.all(
          round.proposals
            .filter((p) => p.winner)
            .map(async (proposal) => {
              const movie = proposal.winner!;

              // Get votes for this movie in this round
              const votes = await prisma.movieVote.findMany({
                where: {
                  roundId: round.id,
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

              // Calculate average rating
              const roundRating =
                votes.length > 0
                  ? votes.reduce((sum, v) => sum + v.rating, 0) / votes.length
                  : null;

              // Get proposer name
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
                  votes.find((v) => v.user.id === session.user.id)?.rating ||
                  null,
                proposer,
              };
            }),
        );

        // Sort by rating and find best
        const sortedWinners = [...winners].sort(
          (a, b) => (b.roundRating || 0) - (a.roundRating || 0),
        );
        const bestRating = sortedWinners[0]?.roundRating;
        const bests = sortedWinners.filter((w) => w.roundRating === bestRating);

        return {
          id: round.id,
          name: round.name,
          closed: round.closed,
          date: round.date
            ? new Date(round.date).toLocaleDateString("it-IT")
            : null,
          createdAt: new Date(round.createdAt).toLocaleDateString("it-IT"),
          chooser: round.chooser
            ? {
                id: round.chooser.id,
                name: round.chooser.name,
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
      }),
    );

    const status = offset + limit >= totalCount ? "completed" : "progress";

    return res.status(200).json({ body, status });
  } catch (error) {
    console.error("Error fetching oscars rounds:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
