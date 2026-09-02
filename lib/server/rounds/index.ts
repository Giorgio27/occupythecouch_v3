// lib/rounds.ts
import { Prisma } from "@prisma/client";
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
  console.info(`[closeRound] starting for round ${roundId}`);

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
    console.error(`[closeRound] round ${roundId} not found`);
    throw new Error("Round not found");
  }

  // Idempotency guard: a closed round has already produced its rankings.
  // Re-running would create duplicate MovieRoundRanking/UserRanking links
  // and double-count averages, so bail out early.
  if (round.closed) {
    console.error(`[closeRound] round ${roundId} is already closed`);
    const error: Error & { code?: string } = new Error(
      "Round is already closed",
    );
    error.code = "ROUND_ALREADY_CLOSED";
    throw error;
  }

  // All movie votes for this round
  const votes = await prisma.movieVote.findMany({
    where: { roundId: round.id },
  });
  console.info(
    `[closeRound] round ${roundId}: ${round.proposals.length} proposals, ${votes.length} votes`,
  );

  // Check that all proposals are closed, have a winner and have votes
  const votesByMovieId = new Map<string, number>();
  for (const v of votes) {
    votesByMovieId.set(v.movieId, (votesByMovieId.get(v.movieId) ?? 0) + 1);
  }

  const openProposals = round.proposals.filter((p) => !p.closed);
  const proposalsWithoutWinner = round.proposals.filter(
    (p) => p.closed && !p.winnerId,
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
    console.error(
      `[closeRound] round ${roundId} not ready: ${openProposals.length} open, ` +
        `${proposalsWithoutWinner.length} without winner, ${proposalsWithoutVotes.length} without votes`,
    );
    const error: Error & { code?: string; details?: unknown } = new Error(
      "Round cannot be closed: some proposals are still open or are missing winner/votes",
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

  // Find the winning rating and winning movie ids (only meaningful when we
  // actually have rated movies; otherwise there is nothing to rank).
  const ratings = Array.from(movieToAvg.values());
  const winningRating = ratings.length > 0 ? Math.max(...ratings) : null;

  const winningMovieIds =
    winningRating === null
      ? []
      : Array.from(movieToAvg.entries())
          .filter(([_, avg]) => avg === winningRating)
          .map(([movieId]) => movieId);

  console.info(
    `[closeRound] round ${roundId}: ${movieToAvg.size} rated movies, winningRating=${winningRating}, winners=${winningMovieIds.length}`,
  );

  // Everything below mutates the DB. Run it inside a single interactive
  // transaction so a failure halfway through never leaves the round with
  // partial rankings (which would then be duplicated on retry).
  const transactionStartedAt = Date.now();
  let closedRound;
  try {
    closedRound = await prisma.$transaction(
      async (tx) => {
        // Atomic idempotency claim: flip closed false -> true and only proceed
        // if we were the ones to flip it. Two concurrent close calls (or a
        // retry after a committed close) will see count === 0 and abort,
        // rolling back without writing any rankings.
        const claim = await tx.round.updateMany({
          where: { id: round.id, closed: false },
          data: { closed: true },
        });
        if (claim.count === 0) {
          console.error(
            `[closeRound] round ${roundId}: idempotency claim lost (already closed concurrently)`,
          );
          const error: Error & { code?: string } = new Error(
            "Round is already closed",
          );
          error.code = "ROUND_ALREADY_CLOSED";
          throw error;
        }

        if (movieToAvg.size === 0) {
          // No winners or no votes: the round is already marked closed above,
          // nothing else to compute.
          console.info(
            `[closeRound] round ${roundId}: no rated movies, closed with no rankings`,
          );
          return tx.round.findUniqueOrThrow({ where: { id: round.id } });
        }

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

          // Collect users that own this proposal (user or team.users)
          const userIds: string[] = [];

          if (ownerTeamId && proposal.ownerTeam) {
            userIds.push(...proposal.ownerTeam.users.map((tu) => tu.userId));
          } else if (ownerUserId) {
            userIds.push(ownerUserId);
          }

          // Vote ids for this movie, already loaded above — no extra query.
          const movieVoteIds = votes
            .filter((v) => v.movieId === movieId)
            .map((v) => v.id);

          // Single nested write: creates the MovieRoundRanking row, links
          // its votes (connect), and gets-or-creates + links each owner's
          // UserRanking (connectOrCreate) — all in one round trip instead
          // of the create + updateMany + upsert + create sequence this
          // used to be (this loop is the bulk of a round close's latency
          // through Prisma Accelerate, so fewer round trips matters a lot).
          const mrr = await tx.movieRoundRanking.create({
            data: {
              roundId: round.id,
              movieId,
              userId: ownerUserId,
              teamId: ownerTeamId,
              averageRating,
              roundWinner: isRoundWinner,
              movieVotes: {
                connect: movieVoteIds.map((id) => ({ id })),
              },
              userRankings: {
                create: userIds.map((userId) => ({
                  userRanking: {
                    connectOrCreate: {
                      where: {
                        userId_cineforumId: {
                          userId,
                          cineforumId: round.cineforumId,
                        },
                      },
                      create: { userId, cineforumId: round.cineforumId },
                    },
                  },
                })),
              },
            },
            include: {
              userRankings: { select: { userRankingId: true } },
            },
          });

          for (const link of mrr.userRankings) {
            rankingIdsToRecompute.add(link.userRankingId);
          }
        }

        // Recompute averages for all affected user rankings
        console.info(
          `[closeRound] round ${roundId}: recomputing ${rankingIdsToRecompute.size} user rankings`,
        );
        await recomputeUserRankings(tx, Array.from(rankingIdsToRecompute));

        // Finally flag the round as oscarable (it is already marked closed).
        return tx.round.update({
          where: { id: round.id },
          data: {
            oscarable: true,
          },
        });
      },
      // Prisma Accelerate caps interactive transactions at 15000ms — asking
      // for more (e.g. the previous 60_000) makes it reject the transaction
      // outright with P6005 before it even starts.
      { timeout: 14_000, maxWait: 5_000 },
    );
  } catch (error: unknown) {
    const elapsedMs = Date.now() - transactionStartedAt;
    const err = error as { code?: string; message?: string };
    console.error(
      `[closeRound] round ${roundId}: transaction failed after ${elapsedMs}ms ` +
        `(code=${err?.code ?? "?"}): ${err?.message ?? error}`,
    );
    throw error;
  }

  console.info(
    `[closeRound] round ${roundId}: transaction committed after ${Date.now() - transactionStartedAt}ms`,
  );
  return closedRound;
}

/**
 * Recompute UserRanking averages for many rankings at once:
 * - averageRating: average of mrr.averageRating
 * - external ratings: normalized /10 -> /5 (value / 2) then averaged
 *
 * Fetches every ranking (with its MovieRoundRankings + movies) in a single
 * query instead of one findUnique per ranking — the per-ranking update still
 * has to run individually since each writes different computed values, but
 * this halves the round trips this step needs.
 */
async function recomputeUserRankings(
  tx: Prisma.TransactionClient,
  rankingIds: string[],
): Promise<void> {
  if (rankingIds.length === 0) return;

  const rankings = await tx.userRanking.findMany({
    where: { id: { in: rankingIds } },
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

  for (const ranking of rankings) {
    const mrrs = ranking.movieRoundRankings
      .map((link) => link.movieRoundRanking)
      .filter((mrr): mrr is NonNullable<typeof mrr> => !!mrr);

    if (mrrs.length === 0) {
      await tx.userRanking.update({
        where: { id: ranking.id },
        data: {
          averageRating: null,
          averageImdbRating: null,
          averageTmdbRating: null,
          averageRotoRating: null,
          averageMetaRating: null,
        },
      });
      continue;
    }

    // Internal average rating
    const ratings = mrrs
      .map((m) => m.averageRating)
      .filter((x): x is number => x != null);

    const averageRating =
      ratings.length > 0
        ? Number(
            (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2),
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

    await tx.userRanking.update({
      where: { id: ranking.id },
      data: {
        averageRating,
        averageImdbRating: avgOrNull(imdbValues),
        averageTmdbRating: avgOrNull(tmdbValues),
        averageRotoRating: avgOrNull(rotoValues),
        averageMetaRating: avgOrNull(metaValues),
      },
    });
  }
}
