import prisma from "@/lib/prisma";
import type { VoterParticipationDTO } from "@/lib/shared/types";

type RoundVote = {
  movieId: string;
  user: { id: string; name: string | null };
};

/**
 * Computes, for every active member, how many of the round's winner movies
 * they have voted on so far. Members with zero votes are still included so
 * admins can see at a glance who hasn't voted yet.
 *
 * @param cineforumId - The cineforum identifier
 * @param votes - All votes already fetched for the round
 * @param winnerMovieIds - Ids of the round's winner movies
 */
export async function getVoterParticipation(
  cineforumId: string,
  votes: RoundVote[],
  winnerMovieIds: Set<string>,
): Promise<VoterParticipationDTO[]> {
  const activeMemberships = await prisma.membership.findMany({
    where: { cineforumId, disabled: false },
    select: { userId: true, user: { select: { name: true } } },
  });

  const votedCounts = new Map<string, number>();
  for (const v of votes) {
    if (!winnerMovieIds.has(v.movieId)) continue;
    votedCounts.set(v.user.id, (votedCounts.get(v.user.id) ?? 0) + 1);
  }

  return activeMemberships
    .map((m) => ({
      userId: m.userId,
      name: m.user.name ?? "?",
      votedCount: votedCounts.get(m.userId) ?? 0,
    }))
    .sort((a, b) => b.votedCount - a.votedCount);
}
