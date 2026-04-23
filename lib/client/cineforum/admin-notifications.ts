import { jsonFetch } from "@/lib/client/https";
import type { TelegramSettingsDTO } from "@/lib/shared/types/cineforum";

/**
 * Fetch the current Telegram notification settings for a cineforum.
 * The bot token is never returned in full — only whether it is set.
 */
export async function fetchNotificationSettings(
  cineforumId: string,
): Promise<TelegramSettingsDTO> {
  return jsonFetch<TelegramSettingsDTO>(
    `/api/cineforum/${cineforumId}/admin/notifications`,
  );
}

/**
 * Save Telegram notification settings for a cineforum.
 * `botToken` is only sent if non-empty (empty = keep existing token).
 * `locale` must be "it" or "en".
 */
export async function saveNotificationSettings(
  cineforumId: string,
  botToken: string,
  chatId: string,
  locale: string,
): Promise<void> {
  const body: Record<string, string> = { chatId, locale };
  if (botToken.trim()) {
    body.botToken = botToken.trim();
  }
  await jsonFetch(`/api/cineforum/${cineforumId}/admin/notifications`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Send a test Telegram message using the stored credentials.
 * Throws if credentials are not configured or the request fails.
 */
export async function sendTestNotification(cineforumId: string): Promise<void> {
  await jsonFetch(`/api/cineforum/${cineforumId}/admin/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
