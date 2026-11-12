import prisma from "@/lib/prisma";
import { getProposalUserStats } from "@/lib/server/rankings/proposals-stats";
import { getWeightedAverageRatings } from "@/lib/server/rankings/user-rating-weights";
import type { ProfileAxisKey } from "@/lib/shared/types";

/** Raw metric per axis, keyed by userId. Missing key = no data for that member. */
export type ProfileMetrics = Record<ProfileAxisKey, Map<string, number>>;

/** Axes where a lower raw value is the stronger one. */
export const LOWER_IS_BETTER: ReadonlySet<ProfileAxisKey> = new Set<ProfileAxisKey>([
  "speed",
  "harmony",
]);

type Totals = { sum: number; absDeviation: number; n: number; withConsensus: number };

/** Club-relative generosity and closeness to consensus from the Oscars votes. */
async function getVotingMetrics(
  cineforumId: string,
): Promise<{ generosity: Map<string, number>; harmony: Map<string, number> }> {
  const votes = await prisma.movieVote.findMany({
    where: { round: { cineforumId, closed: true } },
    select: {
      userId: true,
      rating: true,
      movieRoundRanking: { select: { averageRating: true } },
    },
  });

  const totals = new Map<string, Totals>();
  let grandSum = 0;
  for (const v of votes) {
    grandSum += v.rating;
    const t = totals.get(v.userId) ?? { sum: 0, absDeviation: 0, n: 0, withConsensus: 0 };
    t.sum += v.rating;
    t.n += 1;
    const consensus = v.movieRoundRanking?.averageRating;
    if (consensus != null) {
      t.absDeviation += Math.abs(v.rating - consensus);
      t.withConsensus += 1;
    }
    totals.set(v.userId, t);
  }

  const globalAverage = votes.length > 0 ? grandSum / votes.length : 0;
  const generosity = new Map<string, number>();
  const harmony = new Map<string, number>();
  for (const [userId, t] of Array.from(totals.entries())) {
    generosity.set(userId, t.sum / t.n - globalAverage);
    if (t.withConsensus > 0) harmony.set(userId, t.absDeviation / t.withConsensus);
  }
  return { generosity, harmony };
}

/** Critics' rating (Metacritic + Rotten Tomatoes, /5) of each member's screened picks. */
async function getCinephileMetric(cineforumId: string): Promise<Map<string, number>> {
  const rankings = await prisma.userRanking.findMany({
    where: { cineforumId },
    select: { userId: true, averageMetaRating: true, averageRotoRating: true },
  });
  const result = new Map<string, number>();
  for (const r of rankings) {
    const values = [r.averageMetaRating, r.averageRotoRating].filter(
      (v): v is number => v !== null,
    );
    if (values.length > 0) {
      result.set(r.userId, values.reduce((s, v) => s + v, 0) / values.length);
    }
  }
  return result;
}

/**
 * Collects the raw metric behind each "profile" hexagon axis: talent (weighted
 * club rating of their picks), cinephile (critics' rating of their picks),
 * presence (% of proposals voted), speed (hours to vote), harmony (average
 * distance from the movie's club average), generosity (own average minus the
 * club's).
 */
export async function getProfileMetrics(cineforumId: string): Promise<ProfileMetrics> {
  const [talent, cinephile, proposalStats, voting] = await Promise.all([
    getWeightedAverageRatings(cineforumId),
    getCinephileMetric(cineforumId),
    getProposalUserStats(cineforumId),
    getVotingMetrics(cineforumId),
  ]);

  const presence = new Map<string, number>();
  const speed = new Map<string, number>();
  for (const u of proposalStats.users) {
    const expected = u.proposals_voted + u.proposals_missed;
    if (expected > 0) presence.set(u.user_id, (u.proposals_voted / expected) * 100);
    if (u.avg_vote_delay_hours !== null) speed.set(u.user_id, u.avg_vote_delay_hours);
  }

  return { talent, cinephile, presence, speed, ...voting };
}

/**
 * Percentile (0–100) of `value` among `values`, ties counting half: the best
 * member gets 100, the worst 0. With a single member it's 50.
 */
export function percentileOf(value: number, values: number[], lowerIsBetter: boolean): number {
  if (values.length <= 1) return 50;
  let beaten = 0;
  for (const other of values) {
    if (other === value) beaten += 0.5;
    else if (lowerIsBetter ? other > value : other < value) beaten += 1;
  }
  // Exclude the member's own half-tie with itself.
  return Math.round(((beaten - 0.5) / (values.length - 1)) * 100);
}
