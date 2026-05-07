import type { CineforumSummaryDTO } from "@/lib/shared/types";
import { jsonFetch } from "../https";

/**
 * Creates a new cineforum with the given name.
 *
 * @param payload - Object containing the cineforum name
 * @returns Promise resolving to a CineforumSummaryDTO with the created cineforum's details
 */
export async function createCineforum(payload: {
  name: string;
}): Promise<CineforumSummaryDTO> {
  return jsonFetch<CineforumSummaryDTO>("/api/cineforums/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
