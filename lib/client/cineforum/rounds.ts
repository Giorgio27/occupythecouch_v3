import type {
  RoundSummaryDTO,
  RoundsListResponseDTO,
  CloseRoundErrorDetails,
} from "@/lib/shared/types";
import { jsonFetch } from "../https";

const PAGE_SIZE = 10;

/**
 * Fetches a paginated page of rounds for a cineforum.
 *
 * @param cineforumId - The cineforum identifier
 * @param page - Zero-based page index
 * @returns Promise resolving to a RoundsListResponseDTO with rounds and pagination info
 */
export async function fetchRoundsPage(
  cineforumId: string,
  page: number,
): Promise<RoundsListResponseDTO> {
  const params = new URLSearchParams({
    cineforumId,
    offset: String(page * PAGE_SIZE),
    limit: String(PAGE_SIZE),
  });

  return jsonFetch<RoundsListResponseDTO>(
    `/api/cineforum/rounds?${params.toString()}`,
  );
}

export type CreateRoundPayload = {
  cineforumId: string;
  name: string;
  date: string;
  chooserUserId?: string;
};

/**
 * Creates a new round in a cineforum.
 *
 * @param payload - The round creation payload including name, date, and optional chooser
 * @returns Promise resolving to the created RoundSummaryDTO
 */
export async function createRound(
  payload: CreateRoundPayload,
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

/**
 * Closes a round, triggering winner computation for all proposals.
 * Returns a structured result instead of throwing, so callers can handle
 * known business errors (e.g. open proposals, missing votes) gracefully.
 *
 * @param cineforumId - The cineforum identifier (unused in request but kept for API symmetry)
 * @param roundId - The round identifier to close
 * @returns Promise resolving to CloseRoundResult — either { ok: true } or an error object
 */
export async function closeRound(
  cineforumId: string,
  roundId: string,
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
