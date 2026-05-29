import prisma from "@/lib/prisma";
import type { SimilarUserDTO, CommonMovieVoteDTO } from "@/lib/shared/types";

// ─── Algorithm constants ───────────────────────────────────────────────────

const MIN_COMMON_RATINGS = 15;
const RELIABILITY_THRESHOLD = 50;
const MIN_PEARSON = 0.25;
const MIN_FINAL_SCORE = 0.15;
// Max possible rating difference on a 1–5 scale
const MAX_RATING_DIFF = 4;
const DEFAULT_LIMIT = 20;

// ─── Pure types ────────────────────────────────────────────────────────────

type Rating = {
  userId: string;
  movieId: string;
  rating: number;
};

type FindSimilarUsersOptions = {
  minCommonRatings?: number;
  reliabilityThreshold?: number;
  minPearson?: number;
  limit?: number;
};

// ─── Pure algorithm functions ──────────────────────────────────────────────

/**
 * Computes the Pearson correlation coefficient between two equal-length arrays.
 * Returns 0 if either array has zero variance (all values identical).
 *
 * @param xs - Ratings from user A
 * @param ys - Ratings from user B (same order as xs)
 * @returns Pearson r in [-1, 1], or 0 when undefined
 */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;

  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);

  // Zero variance in either array → Pearson undefined → return 0
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Computes the average absolute difference between two equal-length arrays.
 * Returns a value in [0, MAX_RATING_DIFF].
 *
 * @param xs - Ratings from user A
 * @param ys - Ratings from user B (same order as xs)
 */
export function averageAbsoluteDifference(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const total = xs.reduce((sum, x, i) => sum + Math.abs(x - ys[i]), 0);
  return total / n;
}

/**
 * Extracts the common movie ratings between two users, preserving order.
 *
 * @param targetRatings - Map of movieId → rating for the target user
 * @param otherRatings  - Map of movieId → rating for the other user
 * @returns Parallel arrays of ratings for movies voted by both users
 */
export function getCommonRatings(
  targetRatings: Map<string, number>,
  otherRatings: Map<string, number>,
): { targetArr: number[]; otherArr: number[] } {
  const targetArr: number[] = [];
  const otherArr: number[] = [];

  // Use Array.from to avoid es5 Map iteration issues
  Array.from(targetRatings.entries()).forEach(([movieId, rating]) => {
    const otherRating = otherRatings.get(movieId);
    if (otherRating !== undefined) {
      targetArr.push(rating);
      otherArr.push(otherRating);
    }
  });

  return { targetArr, otherArr };
}

/**
 * Finds users with similar cinematic taste to the target user using
 * Pearson correlation weighted by the number of common ratings.
 *
 * @param targetUserId - The user to find similar users for
 * @param ratings      - All ratings in the cineforum
 * @param options      - Tuning parameters (all optional)
 * @returns Sorted list of similar users (highest score first)
 */
export function findSimilarUsers(
  targetUserId: string,
  ratings: Rating[],
  options: FindSimilarUsersOptions = {},
): SimilarUserDTO[] {
  const {
    minCommonRatings = MIN_COMMON_RATINGS,
    reliabilityThreshold = RELIABILITY_THRESHOLD,
    minPearson = MIN_PEARSON,
    limit = DEFAULT_LIMIT,
  } = options;

  // Pre-index ratings by userId → (movieId → rating)
  const ratingsByUser = new Map<string, Map<string, number>>();
  ratings.forEach((r) => {
    let userMap = ratingsByUser.get(r.userId);
    if (!userMap) {
      userMap = new Map<string, number>();
      ratingsByUser.set(r.userId, userMap);
    }
    userMap.set(r.movieId, r.rating);
  });

  const targetRatings = ratingsByUser.get(targetUserId);
  if (!targetRatings) return [];

  const results: SimilarUserDTO[] = [];

  // Use Array.from to avoid es5 Map iteration issues
  Array.from(ratingsByUser.entries()).forEach(([otherUserId, otherRatings]) => {
    if (otherUserId === targetUserId) return;

    const { targetArr, otherArr } = getCommonRatings(
      targetRatings,
      otherRatings,
    );
    const commonCount = targetArr.length;

    if (commonCount < minCommonRatings) return;

    const pearson = pearsonCorrelation(targetArr, otherArr);

    if (pearson <= minPearson) return;

    // Distance penalty: 1 when votes are identical, 0 when maximally different
    const avgDiff = averageAbsoluteDifference(targetArr, otherArr);
    const distancePenalty = 1 - avgDiff / MAX_RATING_DIFF;

    const reliabilityWeight = Math.min(commonCount / reliabilityThreshold, 1);
    const score = pearson * distancePenalty * reliabilityWeight;

    if (score < MIN_FINAL_SCORE) return;

    results.push({
      userId: otherUserId,
      userName: "", // resolved after DB lookup
      score,
      pearson,
      commonRatings: commonCount,
      distancePenalty,
      avgAbsDiff: avgDiff,
      compatibilityPercent: Math.round(score * 100),
    });
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// ─── DB-backed functions ───────────────────────────────────────────────────

/**
 * Fetches all movie votes in a cineforum (closed rounds only) and runs
 * the similarity algorithm for the given target user.
 *
 * @param cineforumId  - The cineforum to scope votes to
 * @param targetUserId - The user to find similar users for
 * @param options      - Algorithm tuning parameters
 * @returns Sorted list of similar users with names resolved
 */
export async function getSimilarUsers(
  cineforumId: string,
  targetUserId: string,
  options: FindSimilarUsersOptions = {},
): Promise<SimilarUserDTO[]> {
  const rawVotes = await prisma.movieVote.findMany({
    where: {
      round: { cineforumId, closed: true },
    },
    select: { userId: true, movieId: true, rating: true },
  });

  const ratings: Rating[] = rawVotes.map((v) => ({
    userId: v.userId,
    movieId: v.movieId,
    rating: v.rating,
  }));

  const similar = findSimilarUsers(targetUserId, ratings, options);

  if (similar.length === 0) return [];

  const userIds = similar.map((s) => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });

  const nameMap = new Map(users.map((u) => [u.id, u.name ?? "Unknown"]));

  return similar.map((s) => ({
    ...s,
    userName: nameMap.get(s.userId) ?? "Unknown",
  }));
}

/**
 * Fetches the common movie votes between two users in a cineforum,
 * returning each movie with both ratings and the delta.
 *
 * @param cineforumId  - The cineforum to scope votes to
 * @param targetUserId - The target user
 * @param otherUserId  - The other user to compare against
 * @returns List of common movie votes sorted by absolute delta descending
 */
export async function getCommonMovieVotes(
  cineforumId: string,
  targetUserId: string,
  otherUserId: string,
): Promise<CommonMovieVoteDTO[]> {
  const [targetVotes, otherVotes] = await Promise.all([
    prisma.movieVote.findMany({
      where: { userId: targetUserId, round: { cineforumId, closed: true } },
      select: {
        movieId: true,
        rating: true,
        movie: { select: { id: true, title: true } },
      },
    }),
    prisma.movieVote.findMany({
      where: { userId: otherUserId, round: { cineforumId, closed: true } },
      select: { movieId: true, rating: true },
    }),
  ]);

  const otherMap = new Map(otherVotes.map((v) => [v.movieId, v.rating]));

  const result: CommonMovieVoteDTO[] = [];

  targetVotes.forEach((tv) => {
    const otherRating = otherMap.get(tv.movieId);
    if (otherRating === undefined) return;

    result.push({
      movieId: tv.movieId,
      movieTitle: tv.movie.title,
      targetRating: tv.rating,
      otherRating,
      delta: tv.rating - otherRating,
    });
  });

  result.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return result;
}
