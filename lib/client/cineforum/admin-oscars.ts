import { jsonFetch } from "@/lib/client/https";
import type { OscarsRoundDTO } from "@/lib/shared/types";

/**
 * Fetches the admin preview of the last open round, with each movie's current
 * partial average and per-user votes. Returns null when no open round exists.
 *
 * @param cineforumId - The cineforum identifier
 */
export async function fetchOscarsPreview(
  cineforumId: string,
): Promise<{ body: OscarsRoundDTO | null }> {
  return jsonFetch<{ body: OscarsRoundDTO | null }>(
    `/api/cineforum/${cineforumId}/admin/oscars/preview`,
  );
}
