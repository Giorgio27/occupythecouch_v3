import prisma from "@/lib/prisma";
import type { ProposalUserStatDTO } from "@/lib/shared/types";

export async function getProposalUserStats(
  cineforumId: string,
): Promise<ProposalUserStatDTO[]> {
  const memberships = await prisma.membership.findMany({
    where: { cineforumId, disabled: false },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          proposals: {
            where: { cineforumId },
            select: { id: true },
          },
          proposalVotes: {
            where: { proposal: { cineforumId } },
            select: {
              createdAt: true,
              proposal: { select: { createdAt: true } },
            },
          },
        },
      },
    },
  });

  return memberships.map(({ user }) => {
    const delays = user.proposalVotes.map(
      (v) => v.createdAt.getTime() - v.proposal.createdAt.getTime(),
    );
    const avgDelayHours =
      delays.length > 0
        ? delays.reduce((s, d) => s + d, 0) / delays.length / 3_600_000
        : null;

    return {
      user_id: user.id,
      user_name: user.name ?? user.id,
      proposals_created: user.proposals.length,
      proposals_voted: user.proposalVotes.length,
      avg_vote_delay_hours: avgDelayHours !== null ? Math.round(avgDelayHours * 10) / 10 : null,
    };
  });
}
