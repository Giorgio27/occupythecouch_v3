import { jsonFetch } from "@/lib/client/https";
import type {
  UserStatisticsResponseDTO,
  UserProfileStatsResponseDTO,
  LoveReceivedResponseDTO,
  LoveGivenResponseDTO,
  RatingDistributionResponseDTO,
  DeviantMoviesResponseDTO,
} from "@/lib/shared/types";

/**
 * Fetches user statistics for a specific user in a cineforum.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the user statistics
 */
export async function fetchUserStatistics(
  cineforumId: string,
  userId: string,
): Promise<UserStatisticsResponseDTO> {
  return jsonFetch<UserStatisticsResponseDTO>(
    `/api/cineforum/${cineforumId}/stats/users?userId=${userId}`,
  );
}

/**
 * Fetches user profile statistics (basic stats and voting profile).
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the user profile statistics
 */
export async function fetchUserProfileStats(
  cineforumId: string,
  userId: string,
): Promise<UserProfileStatsResponseDTO> {
  return jsonFetch<UserProfileStatsResponseDTO>(
    `/api/cineforum/${cineforumId}/stats/users/profile?userId=${userId}`,
  );
}

/**
 * Fetches love received data (how others voted for user's movies).
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the love received data
 */
export async function fetchLoveReceived(
  cineforumId: string,
  userId: string,
): Promise<LoveReceivedResponseDTO> {
  return jsonFetch<LoveReceivedResponseDTO>(
    `/api/cineforum/${cineforumId}/stats/users/love-received?userId=${userId}`,
  );
}

/**
 * Fetches love given data (how user voted for others' movies).
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the love given data
 */
export async function fetchLoveGiven(
  cineforumId: string,
  userId: string,
): Promise<LoveGivenResponseDTO> {
  return jsonFetch<LoveGivenResponseDTO>(
    `/api/cineforum/${cineforumId}/stats/users/love-given?userId=${userId}`,
  );
}

/**
 * Fetches rating distribution for a user.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the rating distribution
 */
export async function fetchRatingDistribution(
  cineforumId: string,
  userId: string,
): Promise<RatingDistributionResponseDTO> {
  return jsonFetch<RatingDistributionResponseDTO>(
    `/api/cineforum/${cineforumId}/stats/users/rating-distribution?userId=${userId}`,
  );
}

/**
 * Fetches most deviant movies for a user.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the most deviant movies
 */
export async function fetchDeviantMovies(
  cineforumId: string,
  userId: string,
): Promise<DeviantMoviesResponseDTO> {
  return jsonFetch<DeviantMoviesResponseDTO>(
    `/api/cineforum/${cineforumId}/stats/users/deviant-movies?userId=${userId}`,
  );
}
