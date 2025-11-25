export async function fetchLastRound(cineforumId?: string) {
  const qs = cineforumId
    ? `?cineforumId=${encodeURIComponent(cineforumId)}`
    : "";
  const res = await fetch(`/api/cineforum/rounds/last${qs}`);
  if (!res.ok) throw new Error("Failed to load last round");
  return res.json();
}
