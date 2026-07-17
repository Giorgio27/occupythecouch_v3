import prisma from "@/lib/prisma";
import type { RoundAwardDTO } from "@/lib/shared/types/cineforum";

const EXT_DIVISOR = 2; // external ratings /10 → club /5

/** A film needs this many member votes for its average/σ to be meaningful. */
const MIN_FILM_VOTES = 3;

type WinnerMovie = {
  id: string;
  title: string;
  imdbRating: number | null;
  voteAverage: number | null;
  tomatometer: number | null;
  metascore: number | null;
};

/** Average of a film's available platform scores, on the club's /5 scale. */
function platformAvg(m: WinnerMovie): number | null {
  const vals = [m.imdbRating, m.voteAverage, m.tomatometer, m.metascore]
    .filter((v): v is number => v != null)
    .map((v) => v / EXT_DIVISOR);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const stdev = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};

/**
 * Builds the "pagellone" for a closed oscar round: playful awards for members
 * and films. Only awards whose thresholds are met are returned, so a flat round
 * yields few (or none) — nobody is forced a label. The winner itself is NOT an
 * award (it's already crowned on the card); every award surfaces something that
 * isn't otherwise visible.
 */
export async function getRoundReport(
  cineforumId: string,
  roundId: string,
): Promise<RoundAwardDTO[]> {
  const [proposals, votes, activeMemberships] = await Promise.all([
    prisma.proposal.findMany({
      where: { cineforumId, roundId, winnerId: { not: null } },
      select: {
        winner: {
          select: {
            id: true,
            title: true,
            imdbRating: true,
            voteAverage: true,
            tomatometer: true,
            metascore: true,
          },
        },
      },
    }),
    prisma.movieVote.findMany({
      where: { roundId },
      select: {
        userId: true,
        movieId: true,
        rating: true,
        user: { select: { name: true } },
      },
    }),
    // Member awards go only to still-active members (skip removed/disabled ones).
    prisma.membership.findMany({
      where: { cineforumId, disabled: false },
      select: { userId: true },
    }),
  ]);

  const activeUserIds = new Set(activeMemberships.map((m) => m.userId));

  const films = new Map<string, WinnerMovie>();
  for (const p of proposals) if (p.winner) films.set(p.winner.id, p.winner);
  if (films.size === 0) return [];

  // Only consider votes on this round's winner films.
  const roundVotes = votes.filter((v) => films.has(v.movieId));

  // Per-film club average + σ.
  const filmRatings = new Map<string, number[]>();
  for (const v of roundVotes) {
    (filmRatings.get(v.movieId) ?? filmRatings.set(v.movieId, []).get(v.movieId)!).push(v.rating);
  }
  const filmAvg = new Map<string, number>();
  for (const [mid, rs] of Array.from(filmRatings.entries()))
    filmAvg.set(mid, mean(rs));

  const ratedFilmAvgs = Array.from(filmAvg.values());
  if (ratedFilmAvgs.length === 0) return [];
  const roundMean = mean(ratedFilmAvgs);
  const totalFilms = filmAvg.size;

  // Per-member stats.
  type Member = { name: string; count: number; avg: number; deviation: number };
  const byUser = new Map<string, { name: string; ratings: number[]; devs: number[] }>();
  for (const v of roundVotes) {
    if (!activeUserIds.has(v.userId)) continue; // skip inactive members
    const fa = filmAvg.get(v.movieId)!;
    const slot =
      byUser.get(v.userId) ??
      byUser.set(v.userId, { name: v.user.name ?? "?", ratings: [], devs: [] }).get(v.userId)!;
    slot.ratings.push(v.rating);
    slot.devs.push(Math.abs(v.rating - fa));
  }
  const members: Member[] = Array.from(byUser.values()).map((m) => ({
    name: m.name,
    count: m.ratings.length,
    avg: mean(m.ratings),
    deviation: mean(m.devs),
  }));

  // Members with enough votes to judge their avg/alignment fairly.
  const minVotes = Math.max(3, Math.ceil(totalFilms * 0.4));
  const eligible = members.filter((m) => m.count >= minVotes);

  const awards: RoundAwardDTO[] = [];
  const pushMember = (
    key: string,
    m: Member | undefined,
    value: string,
  ) => {
    if (m) awards.push({ key, kind: "member", subject: m.name, value });
  };

  // ── Member awards ──────────────────────────────────────────────────────
  if (eligible.length >= 2) {
    const byAvgDesc = [...eligible].sort((a, b) => b.avg - a.avg);
    const generoso = byAvgDesc[0];
    if (generoso.avg - roundMean >= 0.12)
      pushMember("generoso", generoso, generoso.avg.toFixed(2));

    const boia = byAvgDesc[byAvgDesc.length - 1];
    if (roundMean - boia.avg >= 0.12) pushMember("boia", boia, boia.avg.toFixed(2));

    const byDev = [...eligible].sort((a, b) => a.deviation - b.deviation);
    const metronomo = byDev[0];
    if (metronomo.deviation <= 0.3)
      pushMember("metronomo", metronomo, metronomo.deviation.toFixed(2));

    const contrario = byDev[byDev.length - 1];
    if (contrario.deviation >= 0.4)
      pushMember("contrario", contrario, contrario.deviation.toFixed(2));
  }

  // Fantasma: fewest votes, only if clearly below the others.
  if (totalFilms >= 5 && members.length >= 2) {
    const byCount = [...members].sort((a, b) => a.count - b.count);
    const ghost = byCount[0];
    const maxCount = byCount[byCount.length - 1].count;
    if (ghost.count < totalFilms * 0.5 && ghost.count < maxCount)
      pushMember("fantasma", ghost, String(ghost.count));
  }

  // Mina vagante: the single biggest one-film disagreement with the group.
  let hot: { name: string; value: string; gap: number } | null = null;
  for (const v of roundVotes) {
    if (!activeUserIds.has(v.userId)) continue; // skip inactive members
    const rs = filmRatings.get(v.movieId)!;
    if (rs.length < MIN_FILM_VOTES) continue;
    const gap = Math.abs(v.rating - filmAvg.get(v.movieId)!);
    if (!hot || gap > hot.gap) {
      hot = {
        name: v.user.name ?? "?",
        gap,
        value: `${films.get(v.movieId)!.title}: ${v.rating.toFixed(2)} vs ${filmAvg
          .get(v.movieId)!
          .toFixed(2)}`,
      };
    }
  }
  if (hot && hot.gap >= 1.25)
    awards.push({ key: "minaVagante", kind: "member", subject: hot.name, value: hot.value });

  // ── Film awards ────────────────────────────────────────────────────────
  const pushFilm = (key: string, mid: string | null, value: string) => {
    if (mid) awards.push({ key, kind: "film", subject: films.get(mid)!.title, value });
  };

  // Spacca-cineforum: most divisive (highest σ among well-voted films).
  let divisive: { mid: string; sd: number } | null = null;
  for (const [mid, rs] of Array.from(filmRatings.entries())) {
    if (rs.length < MIN_FILM_VOTES) continue;
    const sd = stdev(rs);
    if (!divisive || sd > divisive.sd) divisive = { mid, sd };
  }
  if (divisive && divisive.sd >= 0.8)
    pushFilm("spaccaCineforum", divisive.mid, `σ ${divisive.sd.toFixed(2)}`);

  // Club vs platforms: biggest positive gap (tesoro), biggest negative
  // (sopravvalutato) and the film closest to the platform consensus (consensuale).
  let tesoro: { mid: string; diff: number } | null = null;
  let over: { mid: string; diff: number } | null = null;
  let closest: { mid: string; diff: number } | null = null;
  for (const [mid, avg] of Array.from(filmAvg.entries())) {
    const pAvg = platformAvg(films.get(mid)!);
    if (pAvg == null) continue;
    const diff = avg - pAvg;
    if (!tesoro || diff > tesoro.diff) tesoro = { mid, diff };
    if (!over || diff < over.diff) over = { mid, diff };
    if (!closest || Math.abs(diff) < Math.abs(closest.diff))
      closest = { mid, diff };
  }
  if (tesoro && tesoro.diff >= 0.5)
    pushFilm("tesoro", tesoro.mid, `+${tesoro.diff.toFixed(1)}`);
  if (over && over.diff <= -0.5)
    pushFilm("sopravvalutato", over.mid, over.diff.toFixed(1));
  // Only when it's genuinely close and not already one of the extremes above.
  if (
    closest &&
    Math.abs(closest.diff) <= 0.5 &&
    closest.mid !== tesoro?.mid &&
    closest.mid !== over?.mid
  )
    pushFilm("consensuale", closest.mid, Math.abs(closest.diff).toFixed(2));

  return awards;
}
