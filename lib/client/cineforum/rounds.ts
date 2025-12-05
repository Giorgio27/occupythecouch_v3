import type {
  RoundSummaryDTO,
  RoundsListResponseDTO,
  CloseRoundErrorDetails,
} from "@/lib/shared/types";
import { jsonFetch } from "../https";

const PAGE_SIZE = 10;

export async function fetchRoundsPage(
  cineforumId: string,
  page: number
): Promise<RoundsListResponseDTO> {
  const params = new URLSearchParams({
    cineforumId,
    offset: String(page * PAGE_SIZE),
    limit: String(PAGE_SIZE),
  });

  return jsonFetch<RoundsListResponseDTO>(
    `/api/cineforum/rounds?${params.toString()}`
  );
}

export type CreateRoundPayload = {
  cineforumId: string;
  name: string;
  date: string;
  chooserUserId?: string;
};

export async function createRound(
  payload: CreateRoundPayload
): Promise<RoundSummaryDTO> {
  return jsonFetch<RoundSummaryDTO>("/api/cineforum/rounds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type CloseRoundResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      error: string;
      details?: CloseRoundErrorDetails;
    };

export async function closeRound(
  cineforumId: string,
  roundId: string
): Promise<CloseRoundResult> {
  const res = await fetch(`/api/cineforum/rounds/${roundId}/close`, {
    method: "POST",
  });

  const body = await res.json().catch(() => ({}));

  if (res.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    status: res.status,
    error: body?.error || "Failed to close round",
    details: body?.details,
  };
}

export { PAGE_SIZE };
