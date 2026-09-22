import prisma from "@/lib/prisma";

/**
 * Counts the enabled members of a cineforum who are still expected to vote on a
 * proposal. Proposers never vote on their own proposal, so the owner user (or
 * every member of the owner team) is excluded — same rule used to build the
 * "missing voters" list of the vote notification.
 */
export async function countRemainingVoters(params: {
  cineforumId: string;
  ownerUserId: string | null;
  ownerTeamId: string | null;
  votedUserIds: string[];
}): Promise<number> {
  const { cineforumId, ownerUserId, ownerTeamId, votedUserIds } = params;

  const [enabledMembers, ownerTeamUsers] = await Promise.all([
    prisma.membership.findMany({
      where: { cineforumId, disabled: false },
      select: { userId: true },
    }),
    ownerTeamId
      ? prisma.teamUser.findMany({
          where: { teamId: ownerTeamId },
          select: { userId: true },
        })
      : Promise.resolve([] as { userId: string }[]),
  ]);

  const notExpected = new Set(votedUserIds);
  if (ownerUserId) notExpected.add(ownerUserId);
  for (const tu of ownerTeamUsers) notExpected.add(tu.userId);

  return enabledMembers.filter((m) => !notExpected.has(m.userId)).length;
}
