import { jsonFetch } from "@/lib/client/https";
import { RoundSummaryDTO } from "@/lib/shared/types";

export async function fetchLastRound(
  cineforumId?: string
): Promise<RoundSummaryDTO | null> {
  const qs = cineforumId
    ? `?cineforumId=${encodeURIComponent(cineforumId)}`
    : "";
  return jsonFetch<RoundSummaryDTO | null>(`/api/cineforum/rounds/last${qs}`);
}
