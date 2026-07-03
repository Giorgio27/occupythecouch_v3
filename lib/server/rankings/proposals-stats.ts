import prisma from "@/lib/prisma";
import type { ProposalUserStatDTO } from "@/lib/shared/types";

export type ProposalUserStatsResult = {
  users: ProposalUserStatDTO[];
  /** Authoritative total number of proposals in the cineforum (user- and team-owned). */
  totalCreated: number;
  /** Authoritative total number of proposal votes in the cineforum. */
  totalVoted: number;
};

export async function getProposalUserStats(
  cineforumId: string,
): Promise<ProposalUserStatsResult> {
  const [memberships, proposals] = await Promise.all([
    prisma.membership.findMany({
      where: { cineforumId, disabled: false },
      select: {
        // Join date: only proposals created on/after this count as "should have voted".
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            // Teams the user belongs to within this cineforum.
            teamMemberships: {
              where: { team: { cineforumId } },
              select: { teamId: true },
            },
          },
        },
      },
    }),
    prisma.proposal.findMany({
      where: { cineforumId },
      select: {
        createdAt: true,
        closed: true,
        ownerUserId: true,
        ownerTeamId: true,
        votes: { select: { userId: true, createdAt: true } },
      },
    }),
  ]);

  const totalCreated = proposals.length;
  const totalVoted = proposals.reduce((s, p) => s + p.votes.length, 0);

  const users = memberships.map(({ createdAt: joinedAt, user }) => {
    const teamIds = new Set(user.teamMemberships.map((tm) => tm.teamId));
    const joinedMs = joinedAt.getTime();

    let solo = 0;
    let team = 0;
    let voted = 0;
    let missed = 0;
    let delaySum = 0;

    for (const p of proposals) {
      const ownedByUser = p.ownerUserId === user.id;
      const ownedByUserTeam = p.ownerTeamId !== null && teamIds.has(p.ownerTeamId);
      if (ownedByUser) solo++;
      if (ownedByUserTeam) team++;

      const myVote = p.votes.find((v) => v.userId === user.id);
      if (myVote) {
        voted++;
        delaySum += myVote.createdAt.getTime() - p.createdAt.getTime();
      } else if (
        // Missed = a real voting event the user skipped: a closed proposal that
        // received at least one vote (so it was actually being tracked/voted),
        // created after the user joined, not owned by the user or one of their
        // teams, and never voted by the user.
        // The `votes.length > 0` guard excludes proposals from before vote
        // tracking existed (e.g. bulk-imported early rounds with zero votes),
        // which would otherwise show as missed votes for every founding member.
        p.closed &&
        p.votes.length > 0 &&
        p.createdAt.getTime() >= joinedMs &&
        !ownedByUser &&
        !ownedByUserTeam
      ) {
        missed++;
      }
    }

    const avgDelayHours = voted > 0 ? delaySum / voted / 3_600_000 : null;

    return {
      user_id: user.id,
      user_name: user.name ?? user.id,
      proposals_created: solo + team,
      proposals_created_solo: solo,
      proposals_created_team: team,
      proposals_voted: voted,
      proposals_missed: missed,
      avg_vote_delay_hours: avgDelayHours !== null ? Math.round(avgDelayHours * 10) / 10 : null,
    };
  });

  return { users, totalCreated, totalVoted };
}
