// lib/rounds.ts
import prisma from "@/lib/prisma";

/**
 * List rounds for a cineforum with simple pagination.
 */
export async function listRoundsForCineforum(options: {
  cineforumId: string;
  offset?: number;
  limit?: number;
}) {
  const { cineforumId, offset = 0, limit = 10 } = options;

  const [items, total] = await Promise.all([
    prisma.round.findMany({
      where: { cineforumId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
      include: {
        chooser: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.round.count({ where: { cineforumId } }),
  ]);

  const status = offset + limit >= total ? "completed" : "progress";

  return { items, total, status };
}

/**
 * Create a round in a cineforum.
 */
export async function createRound(options: {
  cineforumId: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  chooserUserId?: string | null;
}) {
  const { cineforumId, name, date, chooserUserId } = options;

  const parsedDate = new Date(date); // TODO: handle timezone if needed

  return prisma.round.create({
    data: {
      cineforumId,
      name,
      date: parsedDate,
      chooserId: chooserUserId ?? null,
    },
  });
}

/**
 * Close a round and compute MovieRoundRanking + UserRanking
 */
export async function closeRound(roundId: string) {
  // Fetch round with proposals, winners, owner user/team and team users
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      cineforum: true,
      proposals: {
        include: {
          winner: true,
          ownerUser: true,
          ownerTeam: {
            include: {
              users: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!round) {
    throw new Error("Round not found");
  }

  // All movie votes for this round
  const votes = await prisma.movieVote.findMany({
    where: { roundId: round.id },
  });

  // Check that all proposals are closed, have a winner and have votes
  const votesByMovieId = new Map<string, number>();
  for (const v of votes) {
    votesByMovieId.set(v.movieId, (votesByMovieId.get(v.movieId) ?? 0) + 1);
  }

  const openProposals = round.proposals.filter((p) => !p.closed);
  const proposalsWithoutWinner = round.proposals.filter(
    (p) => p.closed && !p.winnerId
  );
  const proposalsWithoutVotes = round.proposals.filter((p) => {
    if (!p.closed || !p.winnerId) return false;
    const count = votesByMovieId.get(p.winnerId) ?? 0;
    return count === 0;
  });

  const hasIssues =
    openProposals.length > 0 ||
    proposalsWithoutWinner.length > 0 ||
    proposalsWithoutVotes.length > 0;

  if (hasIssues) {
    const error: any = new Error(
      "Round cannot be closed: some proposals are still open or are missing winner/votes"
    );
    error.code = "ROUND_NOT_READY";
    error.details = {
      openProposals: openProposals.map((p) => ({
        id: p.id,
        title: p.title,
        closed: p.closed,
      })),
      proposalsWithoutWinner: proposalsWithoutWinner.map((p) => ({
        id: p.id,
        title: p.title,
        closed: p.closed,
      })),
      proposalsWithoutVotes: proposalsWithoutVotes.map((p) => ({
        id: p.id,
        title: p.title,
        closed: p.closed,
        winnerId: p.winnerId,
      })),
    };
    throw error;
  }

  // Compute average rating per movie
  const movieToAvg = new Map<string, number>();

  for (const proposal of round.proposals) {
    if (!proposal.winnerId) continue;
    const movieId = proposal.winnerId;

    if (!movieToAvg.has(movieId)) {
      const mv = votes.filter((v) => v.movieId === movieId);
      if (mv.length === 0) continue;

      const avg = mv.reduce((sum, v) => sum + v.rating, 0) / mv.length;

      movieToAvg.set(movieId, Number(avg.toFixed(2)));
    }
  }

  if (movieToAvg.size === 0) {
    // No winners or no votes: just mark round as closed and exit.
    return prisma.round.update({
      where: { id: round.id },
      data: { closed: true },
    });
  }

  // Find the winning rating and winning movie ids
  const ratings = Array.from(movieToAvg.values());
  const winningRating = Math.max(...ratings);

  const winningMovieIds = Array.from(movieToAvg.entries())
    .filter(([_, avg]) => avg === winningRating)
    .map(([movieId]) => movieId);

  // Helper to keep track of which user rankings we must recompute
  const rankingIdsToRecompute = new Set<string>();

  // For each proposal, create MovieRoundRanking and update UserRanking
  for (const proposal of round.proposals) {
    if (!proposal.winnerId) continue;

    const movieId = proposal.winnerId;
    const averageRating = movieToAvg.get(movieId) ?? null;
    const isRoundWinner = winningMovieIds.includes(movieId);

    // Decide owner: user or team
    const ownerUserId = proposal.ownerUserId ?? null;
    const ownerTeamId = proposal.ownerTeamId ?? null;

    // Create MovieRoundRanking row
    const mrr = await prisma.movieRoundRanking.create({
      data: {
        roundId: round.id,
        movieId,
        userId: ownerUserId,
        teamId: ownerTeamId,
        averageRating,
        roundWinner: isRoundWinner,
      },
    });

    // Link movie votes for this movie+round to this ranking
    await prisma.movieVote.updateMany({
      where: {
        roundId: round.id,
        movieId,
      },
      data: {
        movieRoundRankingId: mrr.id,
      },
    });

    // Collect users that own this proposal (user or team.users)
    const userIds: string[] = [];

    if (ownerTeamId && proposal.ownerTeam) {
      userIds.push(...proposal.ownerTeam.users.map((tu) => tu.userId));
    } else if (ownerUserId) {
      userIds.push(ownerUserId);
    }

    // For each user, attach MRR to UserRanking (per user + cineforum)
    for (const userId of userIds) {
      const ranking = await prisma.userRanking.upsert({
        where: {
          userId_cineforumId: {
            userId,
            cineforumId: round.cineforumId,
          },
        },
        update: {},
        create: {
          userId,
          cineforumId: round.cineforumId,
        },
      });

      await prisma.userRankingMovieRoundRanking.create({
        data: {
          userRankingId: ranking.id,
          movieRoundRankingId: mrr.id,
        },
      });

      rankingIdsToRecompute.add(ranking.id);
    }
  }

  // Recompute averages for all affected user rankings
  for (const rankingId of Array.from(rankingIdsToRecompute)) {
    await recomputeUserRanking(rankingId);
  }

  // Finally mark round as closed and oscarable = true
  return prisma.round.update({
    where: { id: round.id },
    data: {
      closed: true,
      oscarable: true,
    },
  });
}

/**
 * Recompute UserRanking averages from its MovieRoundRankings:
 * - averageRating: average of mrr.averageRating
 * - external ratings: normalized /10 -> /5 (value / 2) then averaged
 */
async function recomputeUserRanking(rankingId: string) {
  const ranking = await prisma.userRanking.findUnique({
    where: { id: rankingId },
    include: {
      movieRoundRankings: {
        include: {
          movieRoundRanking: {
            include: {
              movie: true,
            },
          },
        },
      },
    },
  });

  if (!ranking) return;

  const mrrs = ranking.movieRoundRankings
    .map((link) => link.movieRoundRanking)
    .filter((mrr): mrr is NonNullable<typeof mrr> => !!mrr);

  if (mrrs.length === 0) {
    await prisma.userRanking.update({
      where: { id: rankingId },
      data: {
        averageRating: null,
        averageImdbRating: null,
        averageTmdbRating: null,
        averageRotoRating: null,
        averageMetaRating: null,
      },
    });
    return;
  }

  // Internal average rating
  const ratings = mrrs
    .map((m) => m.averageRating)
    .filter((x): x is number => x != null);

  const averageRating =
    ratings.length > 0
      ? Number(
          (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2)
        )
      : null;

  // External averages: IMDb, TMDB, Rotten Tomatoes, Metacritic
  const imdbValues: number[] = [];
  const tmdbValues: number[] = [];
  const rotoValues: number[] = [];
  const metaValues: number[] = [];

  for (const mrr of mrrs) {
    const movie = mrr.movie;
    if (!movie) continue;

    if (movie.imdbRating != null) {
      imdbValues.push(movie.imdbRating / 2); // /10 -> /5
    }
    if (movie.voteAverage != null) {
      tmdbValues.push(movie.voteAverage / 2);
    }
    if (movie.tomatometer != null) {
      rotoValues.push(movie.tomatometer / 2);
    }
    if (movie.metascore != null) {
      metaValues.push(movie.metascore / 2);
    }
  }

  const avgOrNull = (arr: number[]) =>
    arr.length === 0
      ? null
      : Number((arr.reduce((sum, v) => sum + v, 0) / arr.length).toFixed(2));

  await prisma.userRanking.update({
    where: { id: rankingId },
    data: {
      averageRating,
      averageImdbRating: avgOrNull(imdbValues),
      averageTmdbRating: avgOrNull(tmdbValues),
      averageRotoRating: avgOrNull(rotoValues),
      averageMetaRating: avgOrNull(metaValues),
    },
  });
}
