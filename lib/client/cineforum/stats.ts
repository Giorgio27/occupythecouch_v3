import { jsonFetch } from "@/lib/client/https";
import type { UserStatisticsResponseDTO } from "@/lib/shared/types";

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
