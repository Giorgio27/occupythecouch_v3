import prisma from "@/lib/prisma";

export type RoundCloseRankingEntry = {
  title: string;
  proposedBy: string | null;
  averageRating: number;
  voteCount: number;
  roundWinner: boolean;
  /** Competition ranking (1, 2, 2, 4, ...) — ties share a place, no gap-free renumbering. */
  rank: number;
};

export type RoundCloseNotificationData = {
  cineforumId: string;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  locale: string;
  roundName: string;
  ranking: RoundCloseRankingEntry[];
};

/**
 * Fetches everything needed to build the Telegram "round closed" messages:
 * the cineforum's notification settings and the round's movies ranked by
 * average rating (highest first). Returns null when the round has no
 * computed rankings (e.g. it closed with no winners/votes).
 */
export async function getRoundCloseNotificationData(
  roundId: string,
): Promise<RoundCloseNotificationData | null> {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    select: {
      name: true,
      cineforumId: true,
      cineforum: {
        select: { telegramBotToken: true, telegramChatId: true, locale: true },
      },
      rankings: {
        select: {
          averageRating: true,
          roundWinner: true,
          movie: { select: { title: true } },
          user: { select: { name: true } },
          team: { select: { name: true } },
          _count: { select: { movieVotes: true } },
        },
      },
    },
  });

  if (!round || !round.cineforum || round.rankings.length === 0) return null;

  const sorted = round.rankings
    .filter((r): r is typeof r & { averageRating: number } => r.averageRating != null)
    .sort((a, b) => b.averageRating - a.averageRating);

  if (sorted.length === 0) return null;

  // Competition ranking: movies tied on averageRating share the same rank
  // (e.g. 1, 2, 2, 4) instead of being arbitrarily split into consecutive
  // places — ties on the winning rating do happen in this club's history.
  let rank = 0;
  let previousRating: number | null = null;
  const ranking: RoundCloseRankingEntry[] = sorted.map((r, i) => {
    if (previousRating === null || r.averageRating !== previousRating) {
      rank = i + 1;
    }
    previousRating = r.averageRating;
    return {
      title: r.movie.title,
      proposedBy: r.user?.name ?? r.team?.name ?? null,
      averageRating: r.averageRating,
      voteCount: r._count.movieVotes,
      roundWinner: r.roundWinner,
      rank,
    };
  });

  return {
    cineforumId: round.cineforumId,
    telegramBotToken: round.cineforum.telegramBotToken,
    telegramChatId: round.cineforum.telegramChatId,
    locale: round.cineforum.locale,
    roundName: round.name,
    ranking,
  };
}
