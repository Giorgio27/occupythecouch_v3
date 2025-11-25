export type ProposalDetailDTO = {
  id: string;
  date: string | null;
  owner: { id: string; type: "User" | "Team" } | null;
  movies: any[];
  winner: any | null;
  closed: boolean;
  votes: {
    id: string;
    user: { id: string; name?: string };
    movie_selection: Record<string, string[]>;
  }[];
  created_at: string;
  description: string | null;
  title: string;
  round: string | null;
  missing_users: string[];
  no_votes_left: boolean;
  show_results: boolean;
};
