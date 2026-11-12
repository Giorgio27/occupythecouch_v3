import { jsonFetch } from "@/lib/client/https";
import type { UserRadarResponseDTO } from "@/lib/shared/types";

/**
 * Fetches the profile, eras and regions hexagons for every active member,
 * plus the club-wide taste hexagons.
 *
 * @param cineforumId - The cineforum identifier
 */
export async function fetchUserRadar(
  cineforumId: string,
): Promise<UserRadarResponseDTO> {
  return jsonFetch<UserRadarResponseDTO>(
    `/api/cineforum/${cineforumId}/stats/users/radar`,
  );
}
