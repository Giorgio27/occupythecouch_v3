/**
 * Escapes characters that are special in Telegram's legacy Markdown
 * `parse_mode` (`_`, `*`, `` ` ``, `[`). Apply this to any dynamic text
 * (movie titles, user names, etc.) interpolated into a Markdown message —
 * an unescaped/unbalanced special character makes Telegram reject the
 * whole message with a "can't parse entities" error.
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([_*`[])/g, "\\$1");
}

/**
 * Send a Telegram message.
 *
 * Credentials are resolved in this order:
 *  1. `token` / `chatId` arguments (per-cineforum DB values)
 *  2. `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` env vars (global fallback)
 *
 * In non-production environments the function is a no-op unless explicit
 * credentials are provided via arguments.
 */
export async function telegramNotify(
  text: string,
  token: string | null,
  chatId: string | null,
): Promise<void> {
  const resolvedToken = token;
  const resolvedChatId = chatId;

  if (!resolvedToken || !resolvedChatId) return;
  if (!token) return;

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 4096) {
    const slice = remaining.slice(0, 4096);
    const cut =
      slice.lastIndexOf(".") !== -1 ? slice.lastIndexOf(".") + 1 : 4096;
    chunks.push(slice.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  chunks.push(remaining);

  for (const chunk of chunks) {
    const response = await fetch(
      `https://api.telegram.org/bot${resolvedToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: resolvedChatId,
          text: chunk,
          parse_mode: "Markdown",
        }),
      },
    ).catch((err: unknown) => {
      console.error("[telegram] fetch error:", err);
      return null;
    });

    if (response) {
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        console.error(
          `[telegram] sendMessage failed (${response.status}):`,
          JSON.stringify(body),
        );
      }
    }
  }
}
