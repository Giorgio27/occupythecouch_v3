import prisma from "@/lib/prisma";
import type {
  OraclePredictionDTO,
  OracleConfidence,
} from "@/lib/shared/types/cineforum";

/** External ratings are on a /10 scale; the club rates on /5 — divide to align. */
const EXT_DIVISOR = 2;
/** A genre/decade needs at least this many past films to inform the model. */
const MIN_SAMPLES = 2;
/** Weight of the genre-affinity adjustment on top of the platform estimate. */
const GENRE_WEIGHT = 0.5;
/** Weight of the decade-affinity adjustment. */
const DECADE_WEIGHT = 0.3;

type Platform = "imdb" | "tmdb" | "rt" | "meta";
const PLATFORMS: Platform[] = ["imdb", "tmdb", "rt", "meta"];

type MovieExternals = {
  imdbRating: number | null;
  voteAverage: number | null;
  tomatometer: number | null;
  metascore: number | null;
  genres: unknown;
  year: number | null;
  releaseDate: Date | null;
};

function normalizeGenres(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .map((g) => (typeof g === "string" ? g : ((g as { name?: string }).name ?? "")))
    .filter(Boolean);
}

function movieYear(m: MovieExternals): number | null {
  return m.year ?? (m.releaseDate ? m.releaseDate.getFullYear() : null);
}

function decadeOf(year: number | null): number | null {
  return year != null ? Math.floor(year / 10) * 10 : null;
}

/** Returns the platform value normalized to the club's scale, or null. */
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

/**
 * Predicts how the club will rank the candidate movies of an OPEN oscar round,
 * WITHOUT ever looking at the club's votes on those candidates.
 *
 * The model is learned from the club's *other* screenings (closed rounds):
 *  - platform bias: on average, how far the club's rating sits above/below each
 *    platform's score (captures "we run harsh/generous vs IMDb", and any scale gap);
 *  - genre affinity: how the club rates each genre relative to its overall mean;
 *  - decade affinity: same, per release decade.
 *
 * Each candidate's predicted rating = platform-implied estimate (its external
 * scores shifted by the learned bias) + genre and decade adjustments, clamped to
 * the club's observed rating range.
 *
 * @param cineforumId - The cineforum identifier
 * @param roundId - The open oscar round whose candidates are being predicted
 */
export async function getOscarPrediction(
  cineforumId: string,
  roundId: string,
): Promise<{
  body: OraclePredictionDTO[];
  confidence: OracleConfidence;
  basedOnFilms: number;
}> {
  const movieSelect = {
    imdbRating: true,
    voteAverage: true,
    tomatometer: true,
    metascore: true,
    genres: true,
    year: true,
    releaseDate: true,
  } as const;

  const [history, candidates] = await Promise.all([
    // Learning set: every OTHER closed-round screening with a club average.
    prisma.movieRoundRanking.findMany({
      where: {
        round: { cineforumId, closed: true },
        roundId: { not: roundId },
        averageRating: { not: null },
      },
      select: { averageRating: true, movie: { select: movieSelect } },
    }),
    // Candidates: the open round's winner movies (their club votes are NOT read).
    prisma.proposal.findMany({
      where: { cineforumId, roundId, winnerId: { not: null } },
      select: { winner: { select: { id: true, title: true, ...movieSelect } } },
    }),
  ]);

  if (history.length === 0) {
    return { body: [], confidence: "tossup", basedOnFilms: 0 };
  }

  // ── Learn the taste model ────────────────────────────────────────────────
  const clubRatings: number[] = [];
  const biasSum: Record<Platform, number> = { imdb: 0, tmdb: 0, rt: 0, meta: 0 };
  const biasCount: Record<Platform, number> = { imdb: 0, tmdb: 0, rt: 0, meta: 0 };
  const genreSum = new Map<string, number>();
  const genreCount = new Map<string, number>();
  const decadeSum = new Map<number, number>();
  const decadeCount = new Map<number, number>();

  for (const h of history) {
    const club = h.averageRating as number;
    clubRatings.push(club);

    for (const p of PLATFORMS) {
      const e = extValue(h.movie, p);
      if (e != null) {
        biasSum[p] += club - e;
        biasCount[p] += 1;
      }
    }
    for (const g of normalizeGenres(h.movie.genres)) {
      genreSum.set(g, (genreSum.get(g) ?? 0) + club);
      genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
    }
    const d = decadeOf(movieYear(h.movie));
    if (d != null) {
      decadeSum.set(d, (decadeSum.get(d) ?? 0) + club);
      decadeCount.set(d, (decadeCount.get(d) ?? 0) + 1);
    }
  }

  const globalMean =
    clubRatings.reduce((s, x) => s + x, 0) / clubRatings.length;
  const histMin = Math.min(...clubRatings);
  const histMax = Math.max(...clubRatings);

  const platformBias: Partial<Record<Platform, number>> = {};
  for (const p of PLATFORMS) {
    if (biasCount[p] > 0) platformBias[p] = biasSum[p] / biasCount[p];
  }

  const genreDelta = (g: string): number | null => {
    const c = genreCount.get(g) ?? 0;
    return c >= MIN_SAMPLES ? genreSum.get(g)! / c - globalMean : null;
  };
  const decadeDelta = (d: number | null): number => {
    if (d == null) return 0;
    const c = decadeCount.get(d) ?? 0;
    return c >= MIN_SAMPLES ? decadeSum.get(d)! / c - globalMean : 0;
  };

  // ── Predict each candidate ───────────────────────────────────────────────
  const body: OraclePredictionDTO[] = [];
  for (const c of candidates) {
    if (!c.winner) continue;
    const m = c.winner;

    // Platform-implied estimate: each available platform's score shifted by the
    // learned bias, weighted by how much history we have for that platform.
    let weightedSum = 0;
    let weight = 0;
    for (const p of PLATFORMS) {
      const e = extValue(m, p);
      const bias = platformBias[p];
      if (e != null && bias != null) {
        weightedSum += (e + bias) * biasCount[p];
        weight += biasCount[p];
      }
    }
    const platformScore = weight > 0 ? weightedSum / weight : null;

    const gDeltas = normalizeGenres(m.genres)
      .map(genreDelta)
      .filter((x): x is number => x != null);
    const gDelta =
      gDeltas.length > 0
        ? gDeltas.reduce((s, x) => s + x, 0) / gDeltas.length
        : 0;
    const dDelta = decadeDelta(decadeOf(movieYear(m)));

    const base = platformScore ?? globalMean;
    let predicted = base + GENRE_WEIGHT * gDelta + DECADE_WEIGHT * dDelta;
    predicted = Math.max(histMin, Math.min(histMax, predicted));

    body.push({
      movie_id: m.id,
      title: m.title,
      predicted_rating: Math.round(predicted * 100) / 100,
    });
  }

  body.sort((a, b) => b.predicted_rating - a.predicted_rating);

  let confidence: OracleConfidence = "sure";
  if (body.length >= 2) {
    const gap = body[0].predicted_rating - body[1].predicted_rating;
    confidence = gap >= 0.4 ? "sure" : gap >= 0.15 ? "likely" : "tossup";
  }

  return { body, confidence, basedOnFilms: history.length };
}
