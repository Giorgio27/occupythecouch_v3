import {
  ProposalDetailDTO,
  ProposalsListResponseDTO,
} from "@/lib/shared/types/cineforum";
import { jsonFetch } from "../https";

export const adminProposalsClient = {
  async getLastProposal(
    cineforumId: string,
  ): Promise<ProposalDetailDTO | null> {
    const response = await jsonFetch<ProposalDetailDTO | null>(
      `/api/cineforum/${cineforumId}/admin/proposals/last`,
    );
    return response;
  },

  async getAllProposals(
    cineforumId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ProposalsListResponseDTO> {
    const response = await jsonFetch<ProposalsListResponseDTO>(
      `/api/cineforum/${cineforumId}/admin/proposals?page=${page}&limit=${limit}`,
    );
    return response;
  },

  async closeProposal(
    cineforumId: string,
    proposalId: string,
    winnerId: string,
  ): Promise<ProposalDetailDTO> {
    const response = await jsonFetch<ProposalDetailDTO>(
      `/api/cineforum/${cineforumId}/admin/proposals/${proposalId}/close`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId }),
      },
    );
    return response;
  },

  async updateProposal(
    cineforumId: string,
    proposalId: string,
    data: { show_results?: boolean },
  ): Promise<ProposalDetailDTO> {
    const response = await jsonFetch<ProposalDetailDTO>(
      `/api/cineforum/${cineforumId}/admin/proposals/${proposalId}/update`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return response;
  },
};
