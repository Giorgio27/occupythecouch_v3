import prisma from "@/lib/prisma";
import {
  parseCountryCodes,
  regionOf,
  toCurrentCountry,
} from "@/lib/server/stats/user-radar/regions";
import {
  ERA_AXES,
  REGION_AXES,
  type EraKey,
  type RegionKey,
  type ShareAxisDTO,
  type TasteRadarDTO,
} from "@/lib/shared/types";

const TOP_COUNTRIES = 3;

type MovieTaste = { year: number | null; countries: string[] };

export type ProposedMovies = {
  /** userId → movieId → taste data, crediting every member of an owner team. */
  byUser: Map<string, Map<string, MovieTaste>>;
  club: Map<string, MovieTaste>;
};

function eraOf(year: number): EraKey {
  if (year < 1960) return "pre1960";
  if (year < 1980) return "y1960_79";
  if (year < 2000) return "y1980_99";
  if (year < 2010) return "y2000_09";
  if (year < 2020) return "y2010_19";
  return "y2020_plus";
}

function toShares<K extends string>(
  keys: readonly K[],
  counts: Map<K, number>,
): ShareAxisDTO<K>[] {
  const total = Array.from(counts.values()).reduce((s, c) => s + c, 0);
  return keys.map((key) => {
    const count = counts.get(key) ?? 0;
    return { key, count, share: total > 0 ? count / total : 0 };
  });
}

/**
 * Loads every candidate movie proposed in the cineforum's closed rounds,
 * grouped by the members credited for it (the owner, or each team member).
 */
export async function loadProposedMovies(
  cineforumId: string,
): Promise<ProposedMovies> {
  const proposals = await prisma.proposal.findMany({
    where: { cineforumId, round: { closed: true } },
    select: {
      ownerUserId: true,
      ownerTeam: { select: { users: { select: { userId: true } } } },
      movies: {
        select: {
          movie: { select: { id: true, year: true, productionCountries: true } },
        },
      },
    },
  });

  const byUser = new Map<string, Map<string, MovieTaste>>();
  const club = new Map<string, MovieTaste>();
  for (const p of proposals) {
    const owners = p.ownerUserId
      ? [p.ownerUserId]
      : (p.ownerTeam?.users.map((u) => u.userId) ?? []);
    for (const { movie } of p.movies) {
      const taste: MovieTaste = {
        year: movie.year,
        countries: parseCountryCodes(movie.productionCountries),
      };
      club.set(movie.id, taste);
      for (const userId of owners) {
        const movies = byUser.get(userId) ?? new Map<string, MovieTaste>();
        movies.set(movie.id, taste);
        byUser.set(userId, movies);
      }
    }
  }
  return { byUser, club };
}

/**
 * Builds the era and region hexagons for a set of distinct movies. A
 * co-production is split evenly across its countries' regions, so each movie
 * weighs 1 overall; the top countries count each movie fully.
 */
export function buildTasteRadar(movies: MovieTaste[]): TasteRadarDTO {
  const eras = new Map<EraKey, number>();
  const regions = new Map<RegionKey, number>();
  const countries = new Map<string, number>();

  for (const { year, countries: codes } of movies) {
    if (year !== null) {
      const era = eraOf(year);
      eras.set(era, (eras.get(era) ?? 0) + 1);
    }
    for (const code of codes) {
      const region = regionOf(code);
      regions.set(region, (regions.get(region) ?? 0) + 1 / codes.length);
    }
    // SU and RU on the same movie are still one country today.
    for (const current of Array.from(new Set(codes.map(toCurrentCountry)))) {
      countries.set(current, (countries.get(current) ?? 0) + 1);
    }
  }

  const topCountries = Array.from(countries.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_COUNTRIES)
    .map(([code, count]) => ({ code, count }));

  return {
    eras: toShares(ERA_AXES, eras),
    regions: toShares(REGION_AXES, regions),
    top_countries: topCountries,
    proposed_movies: movies.length,
  };
}
