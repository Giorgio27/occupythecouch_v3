import { jsonFetch } from "@/lib/client/https";
import {
  ImdbSuggestionDTO,
  ProposalDetailDTO,
  ProposalRankingDTO,
} from "@/lib/shared/types";

export async function fetchProposal(
  proposalId: string
): Promise<ProposalDetailDTO> {
  return jsonFetch<ProposalDetailDTO>(`/api/cineforum/proposals/${proposalId}`);
}

export async function fetchRanking(
  proposalId: string
): Promise<ProposalRankingDTO> {
  return jsonFetch<ProposalRankingDTO>(
    `/api/cineforum/proposals/ranking/${proposalId}`
  );
}

export async function voteProposal<TReturn = { ok: boolean }>(
  proposalId: string,
  lists: Record<string, any[]>
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

export async function createProposal<TReturn = { id: string; title: string }>(
  payload: CreateProposalPayload
): Promise<TReturn> {
  return jsonFetch<TReturn>(`/api/cineforum/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function imdbSearch(query: string): Promise<ImdbSuggestionDTO[]> {
  return jsonFetch<ImdbSuggestionDTO[]>(
    `/api/cineforum/proposals/movies/input/${encodeURIComponent(query)}`
  );
}
