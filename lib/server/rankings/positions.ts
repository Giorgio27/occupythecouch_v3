import prisma from "@/lib/prisma";
import type { UserPositionDTO } from "@/lib/shared/types";
import { scorePositions } from "@/lib/server/rankings/positions-scoring";

/**
 * Computes, for each active member of a cineforum, how many times they
 * placed in each position across all closed rounds — a proposal's rank is
 * its movie's average rating among that round's other proposals — plus a
 * total F1-style score. Team-owned proposals credit every team member
 * individually.
 */
export async function getUserPositions(
  cineforumId: string,
): Promise<UserPositionDTO[]> {
  const [rankings, activeMembers] = await Promise.all([
    prisma.movieRoundRanking.findMany({
      where: {
        round: { cineforumId, closed: true },
        averageRating: { not: null },
      },
      select: {
        roundId: true,
        averageRating: true,
        user: { select: { id: true, name: true } },
        team: {
          select: {
            users: { select: { user: { select: { id: true, name: true } } } },
          },
        },
      },
    }),
    prisma.membership.findMany({
      where: { cineforumId, disabled: false },
      select: { userId: true },
    }),
  ]);

  const activeUserIds = new Set(activeMembers.map((m) => m.userId));

  return scorePositions(rankings).filter((row) =>
    activeUserIds.has(row.user_id),
  );
}
