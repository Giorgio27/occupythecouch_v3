type CandidateId = string;
export type Ballot = CandidateId[][];

export function buildBallotsFromMovieSelection(
  votes: { movieSelection: Record<string, string[]> }[],
  candidates: CandidateId[]
): Ballot[] {
  return votes.map((v) => {
    const ranks = Object.keys(v.movieSelection)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);
    const ballot: string[][] = [];
    for (const r of ranks) {
      const ids = v.movieSelection[String(r)] || [];
      ballot.push(ids.filter((id) => candidates.includes(id)));
    }
    return ballot;
  });
}

export function schulze(candidates: CandidateId[], ballots: Ballot[]) {
  const idx: Record<CandidateId, number> = {};
  candidates.forEach((c, i) => (idx[c] = i));
  const n = candidates.length;

  const d = Array.from({ length: n }, () => Array(n).fill(0));

  for (const ballot of ballots) {
    const rankIndex = new Map<CandidateId, number>();
    ballot.forEach((group, i) => group.forEach((c) => rankIndex.set(c, i)));
    const bottom = ballot.length;
    for (const c of candidates) if (!rankIndex.has(c)) rankIndex.set(c, bottom);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const ci = candidates[i];
        const cj = candidates[j];
        const ri = rankIndex.get(ci)!;
        const rj = rankIndex.get(cj)!;
        if (ri < rj) d[i][j] += 1;
      }
    }
  }

  const p = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (i !== j) p[i][j] = d[i][j] > d[j][i] ? d[i][j] : 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      for (let k = 0; k < n; k++) {
        if (i === k || j === k) continue;
        p[j][k] = Math.max(p[j][k], Math.min(p[j][i], p[i][k]));
      }
    }
  }

  const score = candidates.map((_, a) => {
    let s = 0;
    for (let b = 0; b < n; b++) if (a !== b && p[a][b] > p[b][a]) s++;
    return s;
  });

  const order = candidates
    .map((c, i) => ({ c, s: score[i] }))
    .sort((x, y) => y.s - x.s || (x.c < y.c ? -1 : 1));

  const ranking: Record<CandidateId, number> = {};
  let currentScore = Infinity;
  let currentRank = 0;
  let seen = 0;
  for (const { c, s } of order) {
    seen++;
    if (s < currentScore) {
      currentScore = s;
      currentRank = seen;
    }
    ranking[c] = currentRank;
  }

  return { d, p, score, ranking, order };
}
