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
 * Pass an empty string to clear a field.
 */
export async function saveNotificationSettings(
  cineforumId: string,
  botToken: string,
  chatId: string,
): Promise<void> {
  await jsonFetch(`/api/cineforum/${cineforumId}/admin/notifications`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botToken, chatId }),
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
