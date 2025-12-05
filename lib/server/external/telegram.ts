export async function telegramNotify(text: string) {
  if (process.env.NODE_ENV !== "production") return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

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
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: "Markdown",
      }),
    }).catch(() => {});
  }
}
