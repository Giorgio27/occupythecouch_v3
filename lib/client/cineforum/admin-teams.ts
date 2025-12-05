import { jsonFetch } from "../https";

export interface TeamUser {
  id: string;
  name?: string;
  email?: string;
}

export interface Team {
  id: string;
  name: string;
  created_at: string;
  round_id?: string | null;
  round?: {
    id: string;
    name: string;
  };
  users: TeamUser[];
}

export interface AdminTeamsListResponse {
  body: Team[];
  status: "progress" | "completed";
}

export interface AdminTeamsClient {
  listTeams(
    cineforumId: string,
    options?: {
      offset?: number;
      limit?: number;
    }
  ): Promise<AdminTeamsListResponse>;

  createTeam(
    cineforumId: string,
    data: {
      teamName: string;
      teamUsers: { id: string }[];
    }
  ): Promise<Team>;
}

export const adminTeamsClient: AdminTeamsClient = {
  async listTeams(cineforumId: string, options = { offset: 0, limit: 10 }) {
    try {
      const response = await jsonFetch<AdminTeamsListResponse>(
        `/api/cineforum/${cineforumId}/admin/teams?offset=${options.offset}&limit=${options.limit}`
      );
      return response;
    } catch (error) {
      console.error("Failed to list teams", error);
      throw error;
    }
  },

  async createTeam(
    cineforumId: string,
    data: {
      teamName: string;
      teamUsers: { id: string }[];
    }
  ) {
    try {
      const response = await jsonFetch<Team>(
        `/api/cineforum/${cineforumId}/admin/teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to create team", error);
      throw error;
    }
  },
};
