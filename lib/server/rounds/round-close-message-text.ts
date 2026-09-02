import type { RoundCloseNotificationData } from "@/lib/server/rounds/round-close-notification-data";
import { escapeMarkdown } from "@/lib/server/external/telegram";

const TOP_N = 4;

/** "1 voto" / "N voti" ("1 vote" / "N votes") — singular only for exactly one. */
function votesLabel(count: number, isEn: boolean): string {
  if (isEn) return count === 1 ? "vote" : "votes";
  return count === 1 ? "voto" : "voti";
}

/**
 * Builds the first "round closed" Telegram message: the top N movies
 * (countdown from Nth to 1st place) plus the pagellone section, if any.
 */
export function buildRoundResultsMessage(
  data: RoundCloseNotificationData,
  pagelloneSection: string,
): string {
  const isEn = data.locale === "en";

  const roundName = escapeMarkdown(data.roundName);
  const title = isEn
    ? `🎬 *Round closed: ${roundName}*\n\nHere are the results:\n`
    : `🎬 *Round chiuso: ${roundName}*\n\nEcco i risultati:\n`;

  // data.ranking is sorted best-first (rank ascending). Keep every movie
  // whose rank falls within the top N — ties on the Nth place are kept
  // together rather than arbitrarily dropped — then reverse so the message
  // counts down toward the winner (worst-of-the-top first, 1st place — with
  // the trophy — last), building suspense instead of spoiling it immediately.
  const countdown = data.ranking.filter((e) => e.rank <= TOP_N).reverse();

  const lines = countdown.map((entry) => {
    const rank = entry.rank;
    const medal = rank === 1 ? "🏆 " : "";
    const name = entry.proposedBy ? escapeMarkdown(entry.proposedBy) : null;
    const proposedBy = name
      ? isEn
        ? ` — proposed by ${name}`
        : ` — proposto da ${name}`
      : "";
    return `${medal}${rank}°) *${escapeMarkdown(entry.title)}*${proposedBy} — ${entry.averageRating.toFixed(
      2,
    )} (${entry.voteCount} ${votesLabel(entry.voteCount, isEn)})`;
  });

  return title + lines.join("\n") + pagelloneSection;
}

/**
 * Builds the second "round closed" Telegram message: the full ranking, from
 * 1st to last place.
 */
export function buildRoundFullRankingMessage(
  data: RoundCloseNotificationData,
): string {
  const isEn = data.locale === "en";

  const roundName = escapeMarkdown(data.roundName);
  const title = isEn
    ? `📊 *Full ranking — ${roundName}*\n`
    : `📊 *Classifica completa — ${roundName}*\n`;

  const lines = data.ranking.map((entry) => {
    const medal = entry.roundWinner ? "🏆 " : "";
    return `${medal}${entry.rank}°) *${escapeMarkdown(entry.title)}* — ${entry.averageRating.toFixed(
      2,
    )} (${entry.voteCount} ${votesLabel(entry.voteCount, isEn)})`;
  });

  return title + lines.join("\n");
}
