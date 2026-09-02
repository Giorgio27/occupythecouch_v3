import { telegramNotify } from "@/lib/server/external/telegram";
import { getRoundCloseNotificationData } from "@/lib/server/rounds/round-close-notification-data";
import { buildPagelloneSection } from "@/lib/server/rounds/round-close-pagellone-text";
import {
  buildRoundResultsMessage,
  buildRoundFullRankingMessage,
} from "@/lib/server/rounds/round-close-message-text";

/**
 * Sends the two Telegram messages announcing a closed round: the top movies
 * with the pagellone, then the full ranking. No-ops when the round has no
 * rankings to report or the cineforum has no Telegram credentials. Never
 * throws — a Telegram/notification failure must not affect the caller,
 * which has already closed the round successfully; errors are only logged.
 */
export async function notifyRoundClosed(roundId: string): Promise<void> {
  try {
    const data = await getRoundCloseNotificationData(roundId);
    if (!data) {
      console.info(`[notifyRoundClosed] round ${roundId}: no rankings to report, skipping`);
      return;
    }
    if (!data.telegramBotToken || !data.telegramChatId) {
      console.info(`[notifyRoundClosed] round ${roundId}: no Telegram credentials, skipping`);
      return;
    }

    const pagelloneSection = await buildPagelloneSection(
      data.cineforumId,
      roundId,
      data.locale,
    );

    const resultsMessage = buildRoundResultsMessage(data, pagelloneSection);
    const rankingMessage = buildRoundFullRankingMessage(data);

    console.info(`[notifyRoundClosed] round ${roundId}: sending results message`);
    await telegramNotify(resultsMessage, data.telegramBotToken, data.telegramChatId);

    console.info(`[notifyRoundClosed] round ${roundId}: sending full ranking message`);
    await telegramNotify(rankingMessage, data.telegramBotToken, data.telegramChatId);

    console.info(`[notifyRoundClosed] round ${roundId}: notification complete`);
  } catch (error: unknown) {
    console.error(`[notifyRoundClosed] round ${roundId}: failed`, error);
  }
}
