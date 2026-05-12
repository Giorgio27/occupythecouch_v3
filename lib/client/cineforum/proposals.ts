import { jsonFetch } from "@/lib/client/https";
import type {
  ImdbSuggestionDTO,
  ProposalDetailDTO,
  ProposalRankingDTO,
  ProposalWinnersDTO,
  ProposalsListResponseDTO,
  CandidateDTO,
} from "@/lib/shared/types";

export type { ProposalWinnersDTO, CandidateDTO };

/**
 * Fetches the list of proposal candidates (user and/or team) for a given user and cineforum.
 *
 * @param userId - The ID of the current user
 * @param cineforumId - The cineforum identifier
 * @returns Promise resolving to an array of CandidateDTO
 */
export async function fetchCandidates(
  userId: string,
  cineforumId: string,
): Promise<CandidateDTO[]> {
  return jsonFetch<CandidateDTO[]>(
    `/api/cineforum/users/${userId}/candidates?cineforumId=${cineforumId}`,
  );
}

/**
 * Fetches the full detail of a proposal by its ID.
 *
 * @param proposalId - The proposal identifier
 * @returns Promise resolving to a ProposalDetailDTO
 */
export async function fetchProposal(
  proposalId: string,
): Promise<ProposalDetailDTO> {
  return jsonFetch<ProposalDetailDTO>(`/api/cineforum/proposals/${proposalId}`);
}

/**
 * Fetches the Schulze ranking result for a proposal.
 *
 * @param proposalId - The proposal identifier
 * @returns Promise resolving to a ProposalRankingDTO with sorted movies and votes
 */
export async function fetchRanking(
  proposalId: string,
): Promise<ProposalRankingDTO> {
  return jsonFetch<ProposalRankingDTO>(
    `/api/cineforum/proposals/ranking/${proposalId}`,
  );
}

/**
 * Submits or updates the current user's vote for a proposal.
 *
 * @param proposalId - The proposal identifier
 * @param lists - A map of rank position (as string) to arrays of movie IDs
 * @returns Promise resolving to the API response
 */
export async function voteProposal<TReturn = { ok: boolean }>(
  proposalId: string,
  lists: Record<string, string[]>,
): Promise<TReturn> {
  return jsonFetch<TReturn>(`/api/cineforum/proposals/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId, lists }),
  });
}

export type CreateProposalPayload = {
  cineforumId: string;
  date: string;
  candidate: { id: string; type: "User" | "Team" };
  title: string;
  description: string;
  proposal: ImdbSuggestionDTO[];
};

/**
 * Creates a new proposal in a cineforum.
 *
 * @param payload - The proposal creation payload including movies, date, title, and owner
 * @returns Promise resolving to the created proposal's id and title
 */
export async function createProposal<TReturn = { id: string; title: string }>(
  payload: CreateProposalPayload,
): Promise<TReturn> {
  return jsonFetch<TReturn>(`/api/cineforum/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Searches IMDb for movies matching the given query string.
 *
 * @param query - The search query (movie title or keywords)
 * @returns Promise resolving to an array of IMDb suggestion results
 */
export async function imdbSearch(query: string): Promise<ImdbSuggestionDTO[]> {
  return jsonFetch<ImdbSuggestionDTO[]>(
    `/api/cineforum/proposals/movies/input/${encodeURIComponent(query)}`,
  );
}

/**
 * Fetches the IMDb IDs of all movies that have won a proposal in a cineforum.
 *
 * @param cineforumId - The cineforum identifier
 * @returns Promise resolving to a ProposalWinnersDTO with an array of IMDb IDs
 */
export async function fetchProposalWinners(
  cineforumId: string,
): Promise<ProposalWinnersDTO> {
  return jsonFetch<ProposalWinnersDTO>(
    `/api/cineforum/${cineforumId}/proposals/winners`,
  );
}

/**
 * Fetches a paginated list of all proposals for a cineforum (accessible to all members).
 *
 * @param cineforumId - The cineforum identifier
 * @param page - Page number (1-based)
 * @param limit - Number of proposals per page
 * @returns Promise resolving to a ProposalsListResponseDTO
 */
export async function fetchAllProposals(
  cineforumId: string,
  page: number = 1,
  limit: number = 10,
): Promise<ProposalsListResponseDTO> {
  return jsonFetch<ProposalsListResponseDTO>(
    `/api/cineforum/${cineforumId}/proposals?page=${page}&limit=${limit}`,
  );
}
