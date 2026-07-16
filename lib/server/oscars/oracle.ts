import prisma from "@/lib/prisma";
import type {
  OraclePredictionDTO,
  OracleConfidence,
} from "@/lib/shared/types/cineforum";

/** External ratings are on a /10 scale; the club rates on /5 — divide to align. */
const EXT_DIVISOR = 2;
/** A genre needs at least this many past films to inform the model. */
const MIN_SAMPLES = 2;
/** Samples beyond this add no extra confidence weight to an estimator. */
const SAMPLE_CAP = 6;

/**
 * Per-platform weight of the base. Calibrated by leave-one-round-out over the
 * club's closed rounds (Spearman of predicted vs actual ranking): the audience
 * scores (IMDb/TMDB) track the club well (~0.38), the critic scores (RT/Meta)
 * barely (~0.17). Weighting critics *equally* tanks accuracy (0.27), but a very
 * small critic weight (0.15) is the sweet spot: it nudges accuracy up (0.44) and
 * lets strong "critics' films" surface. Above ~0.3 accuracy collapses again.
 */
const PLATFORM_WEIGHT: Record<Platform, number> = {
  imdb: 1,
  tmdb: 1,
  rt: 0.15,
  meta: 0.15,
};

/**
 * The platform base dominates; the proposer bias is a light, shrunk correction
 * on top. Calibration (leave-one-round-out) showed:
 *  - proposer genuinely helps: at wProp 0.5–0.6 it lifts Spearman ~0.39 → ~0.44,
 *    but only when *shrunk toward the global bias*; on its own (or at full
 *    weight) it overfits and hurts;
 *  - global bias alone does not change within-round ordering (it shifts every
 *    film equally) — it exists to shrink the proposer and to keep the displayed
 *    number on the club's scale;
 *  - director, decade and genre did NOT help (director/decade actively hurt),
 *    so they are disabled (weight 0). The mechanism is kept for easy re-tuning.
 */
const BIAS_WEIGHT = {
  proposer: 0.5,
  director: 0,
  global: 0.6,
} as const;

/** Decade/genre nudges — calibrated to 0 (they did not improve the ranking). */
const DECADE_NUDGE = 0;
const GENRE_NUDGE = 0;

/** Confidence from sample size, saturating at SAMPLE_CAP. */
const conf = (n: number) => Math.min(n, SAMPLE_CAP) / SAMPLE_CAP;

type Platform = "imdb" | "tmdb" | "rt" | "meta";
const PLATFORMS: Platform[] = ["imdb", "tmdb", "rt", "meta"];

type MovieExternals = {
  imdbRating: number | null;
  voteAverage: number | null;
  tomatometer: number | null;
  metascore: number | null;
  director: string | null;
  genres: unknown;
  year: number | null;
  releaseDate: Date | null;
};

/** Running (sum, count) of `club − platform` diffs, one slot per platform. */
type DiffAcc = Record<Platform, { sum: number; count: number }>;
const emptyDiff = (): DiffAcc => ({
  imdb: { sum: 0, count: 0 },
  tmdb: { sum: 0, count: 0 },
  rt: { sum: 0, count: 0 },
  meta: { sum: 0, count: 0 },
});

/** `Movie.genres` JSONB is either string[] or {name}[] — flatten to names. */
function normalizeGenres(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .map((g) => (typeof g === "string" ? g : ((g as { name?: string }).name ?? "")))
    .filter(Boolean);
}

/** Release year, preferring the explicit field over the release date. */
function movieYear(m: MovieExternals): number | null {
  return m.year ?? (m.releaseDate ? m.releaseDate.getFullYear() : null);
}

/** 1978 → 1970. */
function decadeOf(year: number | null): number | null {
  return year != null ? Math.floor(year / 10) * 10 : null;
}

/** Platform value normalized to the club's scale, or null. */
function extValue(m: MovieExternals, p: Platform): number | null {
  const raw =
    p === "imdb"
      ? m.imdbRating
      : p === "tmdb"
        ? m.voteAverage
        : p === "rt"
          ? m.tomatometer
          : m.metascore;
  return raw == null ? null : raw / EXT_DIVISOR;
}

/** Stable key for a proposer (user or team). */
function proposerKey(p: {
  ownerUserId: string | null;
  ownerTeamId: string | null;
}): string | null {
  if (p.ownerUserId) return `u:${p.ownerUserId}`;
  if (p.ownerTeamId) return `t:${p.ownerTeamId}`;
  return null;
}

/**
 * Average of the candidate's normalized platform scores — the "how the film is
 * rated on the platforms" base that dominates the prediction. Returns null when
 * the film has no external ratings at all.
 */
function platformBase(m: MovieExternals): number | null {
  let sum = 0;
  let w = 0;
  for (const p of PLATFORMS) {
    const v = extValue(m, p);
    if (v != null && PLATFORM_WEIGHT[p] > 0) {
      sum += v * PLATFORM_WEIGHT[p];
      w += PLATFORM_WEIGHT[p];
    }
  }
  return w > 0 ? sum / w : null;
}

/**
 * Mean `club − platform` diff of a learned accumulator (proposer/director/global),
 * averaged across the platforms it has data on, plus the number of observations
 * backing it. This is the "adjust the aim" correction. Returns null if empty.
 */
function diffMean(acc: DiffAcc): { mean: number; n: number } | null {
  let sum = 0;
  let w = 0;
  let n = 0;
  for (const p of PLATFORMS) {
    if (acc[p].count > 0 && PLATFORM_WEIGHT[p] > 0) {
      sum += (acc[p].sum / acc[p].count) * PLATFORM_WEIGHT[p];
      w += PLATFORM_WEIGHT[p];
      n += acc[p].count;
    }
  }
  return w > 0 ? { mean: sum / w, n } : null;
}

/**
 * Predicts how the club will rank the candidate movies of an OPEN oscar round,
 * WITHOUT reading the club's votes on those candidates.
 *
 * Calibrated (leave-one-round-out on the club's closed rounds) to:
 *  - base = the film's AUDIENCE platform scores (IMDb/TMDB); critics dropped;
 *  - + a light proposer bias (`club − platform` for this proposer), shrunk
 *    toward the club-wide bias so a single member can't swing it.
 * Director, decade and genre were tested and did not improve ranking, so they
 * are disabled via their weights (the code path remains for re-tuning). The
 * result is clamped to the club's observed rating range.
 */
export async function getOscarPrediction(
  cineforumId: string,
  roundId: string,
): Promise<{
  body: OraclePredictionDTO[];
  confidence: OracleConfidence;
  basedOnFilms: number;
}> {
  // Three phases: (1) pull history + candidates, (2) learn the taste model from
  // history, (3) score each candidate. Nothing here reads the candidates' votes.

  // Movie fields the model needs (platform scores + director/genre/year).
  const movieSelect = {
    imdbRating: true,
    voteAverage: true,
    tomatometer: true,
    metascore: true,
    director: true,
    genres: true,
    year: true,
    releaseDate: true,
  } as const;

  // ── Phase 1: fetch (one round-trip) ───────────────────────────────────────
  const [historyProposals, ratingRows, candidateProposals] = await Promise.all([
    // Learning set: every OTHER closed-round winning proposal (has a proposer).
    prisma.proposal.findMany({
      where: {
        cineforumId,
        closed: true,
        winnerId: { not: null },
        roundId: { not: roundId },
      },
      select: {
        roundId: true,
        winnerId: true,
        ownerUserId: true,
        ownerTeamId: true,
        winner: { select: movieSelect },
      },
    }),
    // Club average rating per (round, movie).
    prisma.movieRoundRanking.findMany({
      where: { round: { cineforumId, closed: true }, averageRating: { not: null } },
      select: { roundId: true, movieId: true, averageRating: true },
    }),
    // Candidates: the open round's winning proposals (their club votes are NOT read).
    prisma.proposal.findMany({
      where: { cineforumId, roundId, winnerId: { not: null } },
      select: {
        winnerId: true,
        ownerUserId: true,
        ownerTeamId: true,
        winner: { select: { id: true, title: true, ...movieSelect } },
      },
    }),
  ]);

  // Quick lookup: club average rating for a given (round, movie).
  const ratingByRoundMovie = new Map<string, number>();
  for (const r of ratingRows) {
    if (r.averageRating != null) {
      ratingByRoundMovie.set(`${r.roundId}:${r.movieId}`, r.averageRating);
    }
  }

  // ── Phase 2: learn the taste model from history ───────────────────────────
  const clubRatings: number[] = []; // every past club rating (for mean & range)
  const globalDiff = emptyDiff(); // club-wide "we vs platforms" bias
  const proposerDiff = new Map<string, DiffAcc>(); // same, per proposer
  const directorDiff = new Map<string, DiffAcc>(); // same, per director
  const genreSum = new Map<string, number>(); // Σ ratings per genre
  const genreCount = new Map<string, number>();
  const decadeSum = new Map<number, number>(); // Σ ratings per decade
  const decadeCount = new Map<number, number>();

  // Add this film's `club − platform` gap into an accumulator, per platform.
  const accDiff = (acc: DiffAcc, m: MovieExternals, club: number) => {
    for (const p of PLATFORMS) {
      const e = extValue(m, p);
      if (e != null) {
        acc[p].sum += club - e;
        acc[p].count += 1;
      }
    }
  };

  for (const h of historyProposals) {
    // Need both the winning movie and its club rating to learn from it.
    if (!h.winner || h.winnerId == null) continue;
    const club = ratingByRoundMovie.get(`${h.roundId}:${h.winnerId}`);
    if (club == null) continue;
    clubRatings.push(club);

    // Club-wide bias.
    accDiff(globalDiff, h.winner, club);

    // Per-proposer bias (create the slot on first sight).
    const pk = proposerKey(h);
    if (pk) {
      let acc = proposerDiff.get(pk);
      if (!acc) proposerDiff.set(pk, (acc = emptyDiff()));
      accDiff(acc, h.winner, club);
    }

    // Per-director bias.
    if (h.winner.director) {
      let acc = directorDiff.get(h.winner.director);
      if (!acc) directorDiff.set(h.winner.director, (acc = emptyDiff()));
      accDiff(acc, h.winner, club);
    }

    // Genre & decade affinity tallies (a film counts toward each of its genres).
    for (const g of normalizeGenres(h.winner.genres)) {
      genreSum.set(g, (genreSum.get(g) ?? 0) + club);
      genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
    }
    const d = decadeOf(movieYear(h.winner));
    if (d != null) {
      decadeSum.set(d, (decadeSum.get(d) ?? 0) + club);
      decadeCount.set(d, (decadeCount.get(d) ?? 0) + 1);
    }
  }

  // No history at all → can't predict anything.
  if (clubRatings.length === 0) {
    return { body: [], confidence: "tossup", basedOnFilms: 0 };
  }

  // Club-wide mean + the observed rating range (used to clamp predictions).
  const globalMean =
    clubRatings.reduce((s, x) => s + x, 0) / clubRatings.length;
  const histMin = Math.min(...clubRatings);
  const histMax = Math.max(...clubRatings);

  // ── Phase 3: score each candidate ─────────────────────────────────────────
  const body: OraclePredictionDTO[] = [];
  for (const c of candidateProposals) {
    if (!c.winner) continue;
    const m = c.winner;

    // Base: how the film is rated on the platforms (dominant term).
    const base = platformBase(m);

    // Bias correction — ONE weighted mean of the proposer/director/global
    // diff-vs-platform. Each contributes weight = priority × sample-confidence,
    // so a sparse (noisy) proposer is automatically shrunk toward the global
    // bias. Applied once, on top of the base — it only nudges the aim.
    let corrNum = 0;
    let corrDen = 0;
    const addCorrection = (acc: DiffAcc | undefined, weight: number) => {
      if (!acc) return;
      const d = diffMean(acc);
      if (!d) return;
      const w = weight * conf(d.n);
      corrNum += d.mean * w;
      corrDen += w;
    };
    const pk = proposerKey(c);
    addCorrection(pk ? proposerDiff.get(pk) : undefined, BIAS_WEIGHT.proposer);
    addCorrection(m.director ? directorDiff.get(m.director) : undefined, BIAS_WEIGHT.director);
    addCorrection(globalDiff, BIAS_WEIGHT.global);
    const biasCorrection = corrDen > 0 ? corrNum / corrDen : 0;

    // Affinity nudges (currently weight 0). Decade = club's mean for this
    // decade minus the overall mean.
    const dec = decadeOf(movieYear(m));
    const decN = dec != null ? (decadeCount.get(dec) ?? 0) : 0;
    const decadeDelta =
      dec != null && decN >= MIN_SAMPLES
        ? decadeSum.get(dec)! / decN - globalMean
        : 0;

    // Genre = mean rating across the film's genres (each weighted by its
    // sample size) minus the overall mean.
    let genreRatingSum = 0;
    let genreWeight = 0;
    for (const genre of normalizeGenres(m.genres)) {
      const cnt = genreCount.get(genre) ?? 0;
      if (cnt >= MIN_SAMPLES) {
        genreRatingSum += genreSum.get(genre)!;
        genreWeight += cnt;
      }
    }
    const genreDelta =
      genreWeight > 0 ? genreRatingSum / genreWeight - globalMean : 0;

    // Final score: platform base + bias correction + (disabled) nudges.
    // No platform scores at all → fall back to the club mean as the base.
    let predicted =
      (base != null ? base + biasCorrection : globalMean) +
      DECADE_NUDGE * decadeDelta +
      GENRE_NUDGE * genreDelta;
    // Never predict outside the club's real rating range.
    predicted = Math.max(histMin, Math.min(histMax, predicted));

    body.push({
      movie_id: m.id,
      title: m.title,
      predicted_rating: Math.round(predicted * 100) / 100,
    });
  }

  // Rank best-first; confidence from how clearly #1 leads #2.
  body.sort((a, b) => b.predicted_rating - a.predicted_rating);

  let confidence: OracleConfidence = "sure";
  if (body.length >= 2) {
    const gap = body[0].predicted_rating - body[1].predicted_rating;
    confidence = gap >= 0.4 ? "sure" : gap >= 0.15 ? "likely" : "tossup";
  }

  return { body, confidence, basedOnFilms: clubRatings.length };
}
