import { jsonFetch } from "../https";
import { ProposalDetailDTO } from "@/lib/shared/types/cineforum";

export interface AdminProposalsClient {
  getLastProposal(cineforumId: string): Promise<ProposalDetailDTO | null>;
  closeProposal(
    cineforumId: string,
    proposalId: string,
    winnerId: string
  ): Promise<ProposalDetailDTO>;
  updateProposal(
    cineforumId: string,
    proposalId: string,
    data: { show_results: boolean }
  ): Promise<ProposalDetailDTO>;
}

export const adminProposalsClient: AdminProposalsClient = {
  async getLastProposal(cineforumId: string) {
    try {
      const response = await jsonFetch<ProposalDetailDTO | null>(
        `/api/cineforum/${cineforumId}/admin/proposals/last`
      );
      return response;
    } catch (error) {
      console.error("Failed to get last proposal", error);
      return null;
    }
  },

  async closeProposal(
    cineforumId: string,
    proposalId: string,
    winnerId: string
  ) {
    try {
      const response = await jsonFetch<ProposalDetailDTO>(
        `/api/cineforum/${cineforumId}/admin/proposals/${proposalId}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ winnerId }),
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to close proposal", error);
      throw error;
    }
  },

  async updateProposal(
    cineforumId: string,
    proposalId: string,
    data: { show_results: boolean }
  ) {
    try {
      const response = await jsonFetch<ProposalDetailDTO>(
        `/api/cineforum/${cineforumId}/admin/proposals/${proposalId}/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to update proposal", error);
      throw error;
    }
  },
};
