import type { CineforumSummaryDTO } from "@/lib/shared/types";
import { jsonFetch } from "../https";

export async function createCineforum(payload: {
  name: string;
}): Promise<CineforumSummaryDTO> {
  return jsonFetch<CineforumSummaryDTO>("/api/cineforums/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
