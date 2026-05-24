import prisma from "@/lib/prisma";
import type { MovieRankingDTO } from "@/lib/shared/types";

/** Maximum allowed search string length to prevent ReDoS. */
const MAX_SEARCH_LENGTH = 100;

/**
 * Escapes PostgreSQL regex metacharacters so a raw user string is treated
 * as a literal substring pattern when passed to the `~*` operator.
 * Users who intentionally type regex syntax (e.g. "^The") will get regex behaviour;
 * accidental metacharacters in plain titles are escaped.
 *
 * Strategy: we do NOT escape — we let the user's input be a real regex.
 * If the regex is invalid, PostgreSQL will throw and we catch it in the route.
 */
function buildRegexPattern(raw: string): string {
  // Trim and truncate only — pass through as-is so users get real regex power.
  return raw.slice(0, MAX_SEARCH_LENGTH).trim();
}

type RankingRow = {
  id: string;
  averageRating: number | null;
  roundWinner: boolean;
  movie: {
    title: string;
    voteAverage: number | null;
    imdbRating: number | null;
    tomatometer: number | null;
    metascore: number | null;
  };
  round: { name: string };
  user: { id: string; name: string | null } | null;
  team: { id: string; name: string | null } | null;
  movieVotes: {
    id: string;
    rating: number;
    user: { id: string; name: string | null };
  }[];
};

/**
 * Fetches paginated movie rankings for a cineforum, with optional regex search on title.
 *
 * The search string is matched against movie titles using PostgreSQL's case-insensitive
 * regex operator (`~*`). Plain substrings work as-is; users may also use regex syntax
 * (e.g. `^The`, `avengers|batman`).
 *
 * @param cineforumId - The cineforum identifier
 * @param offset - Pagination offset (0-based)
 * @param limit - Page size (max 100)
 * @param search - Optional search string (regex, case-insensitive, matched against title)
 * @returns Paginated list of MovieRankingDTO and total matching count
 */
export async function getMovieRankings(
  cineforumId: string,
  offset: number,
  limit: number,
  search: string,
): Promise<{ body: MovieRankingDTO[]; total: number }> {
  const pattern = buildRegexPattern(search);
  const hasSearch = pattern.length > 0;

  // When a regex search is active, first resolve matching movie IDs via raw SQL
  // using PostgreSQL's `~*` (case-insensitive regex match) operator.
  // This avoids Prisma's lack of native regex support while keeping the rest of
  // the query fully typed.
  let matchingMovieIds: string[] | null = null;
  if (hasSearch) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Movie"
      WHERE title ~* ${pattern}
    `;
    matchingMovieIds = rows.map((r) => r.id);
    // Short-circuit: no movies match the regex → return empty immediately
    if (matchingMovieIds.length === 0) {
      return { body: [], total: 0 };
    }
  }

  const baseWhere = {
    round: { cineforumId, closed: true },
    ...(matchingMovieIds !== null ? { movieId: { in: matchingMovieIds } } : {}),
  };

  const [total, rankings] = await Promise.all([
    prisma.movieRoundRanking.count({ where: baseWhere }),
    prisma.movieRoundRanking.findMany({
      where: baseWhere,
      include: {
        movie: {
          select: {
            title: true,
            voteAverage: true,
            imdbRating: true,
            tomatometer: true,
            metascore: true,
          },
        },
        round: { select: { name: true } },
        user: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        movieVotes: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { rating: "desc" },
        },
      },
      orderBy: [{ averageRating: "desc" }, { id: "asc" }],
      skip: offset,
      take: limit,
    }),
  ]);

  const body: MovieRankingDTO[] = (rankings as RankingRow[]).map((ranking) => {
    const owner = ranking.user ?? ranking.team;

    const supplierVote = (value: number | null | undefined): number | null => {
      if (value == null) return null;
      return parseFloat((value / 2.0).toFixed(2));
    };

    const voteDifference = (supplierValue: number | null): number | null => {
      if (supplierValue == null || ranking.averageRating == null) return null;
      return parseFloat((supplierValue - ranking.averageRating).toFixed(2));
    };

    const diffToString = (diff: number | null): string | null => {
      if (diff === null) return null;
      return diff >= 0 ? `+${diff}` : `${diff}`;
    };

    const tmdbVote = supplierVote(ranking.movie.voteAverage);
    const imdbRating = supplierVote(ranking.movie.imdbRating);
    const tomatometer = supplierVote(ranking.movie.tomatometer);
    const metascore = supplierVote(ranking.movie.metascore);

    return {
      id: ranking.id,
      average_rating: ranking.averageRating,
      movie: ranking.movie.title,
      movie_votes: ranking.movieVotes.map((vote) => ({
        id: vote.id,
        rating: vote.rating,
        user: vote.user.name ?? "Unknown",
      })),
      owner: owner?.name ?? "Unknown",
      round: ranking.round.name,
      round_winner: ranking.roundWinner,
      tmdb_vote: tmdbVote,
      imdb_rating: imdbRating,
      tomatometer,
      metascore,
      tmdb_difference: diffToString(voteDifference(tmdbVote)),
      imdb_difference: diffToString(voteDifference(imdbRating)),
      tomato_difference: diffToString(voteDifference(tomatometer)),
      meta_difference: diffToString(voteDifference(metascore)),
    };
  });

  return { body, total };
}
