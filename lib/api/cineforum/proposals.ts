export async function fetchProposal(proposalId: string) {
  const res = await fetch(`/api/cineforum/proposals/${proposalId}`);
  if (!res.ok) throw new Error("Failed to load proposal");
  return res.json();
}

export async function fetchRanking(proposalId: string) {
  const res = await fetch(`/api/cineforum/proposals/ranking/${proposalId}`);
  if (!res.ok) throw new Error("Failed to load ranking");
  return res.json();
}

export async function voteProposal(
  proposalId: string,
  lists: Record<string, any[]>
) {
  const res = await fetch(`/api/cineforum/proposals/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId, lists }),
  });
  if (!res.ok) throw new Error("Failed to vote");
  return res.json();
}

export async function createProposal(payload: {
  cineforumId: string;
  date: string;
  candidate: { id: string; type: "User" | "Team" };
  title: string;
  description: string;
  proposal: any[];
}) {
  const res = await fetch(`/api/cineforum/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export async function imdbSearch(query: string) {
  const res = await fetch(
    `/api/cineforum/proposals/movies/input/${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}
