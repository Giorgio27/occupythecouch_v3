import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { telegramNotify } from "@/lib/server/external/telegram";
import type { TelegramSettingsDTO } from "@/lib/shared/types/cineforum";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (!["GET", "PUT", "POST"].includes(req.method ?? "")) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { cineforumId } = req.query as { cineforumId: string };

    const membership = await prisma.membership.findUnique({
      where: { userId_cineforumId: { userId, cineforumId } },
    });
    if (!membership || membership.disabled)
      return res.status(403).json({ error: "Forbidden" });
    if (!["ADMIN", "OWNER"].includes(membership.role))
      return res.status(403).json({ error: "Forbidden" });

    // GET — read current settings (token masked)
    if (req.method === "GET") {
      const cineforum = await prisma.cineforum.findUnique({
        where: { id: cineforumId },
        select: { telegramBotToken: true, telegramChatId: true },
      });
      if (!cineforum) return res.status(404).json({ error: "Not found" });

      const payload: TelegramSettingsDTO = {
        botTokenSet: !!cineforum.telegramBotToken,
        chatId: cineforum.telegramChatId,
      };
      return res.status(200).json(payload);
    }

    // PUT — save settings
    if (req.method === "PUT") {
      const { botToken, chatId } = req.body as {
        botToken?: string;
        chatId?: string;
      };

      await prisma.cineforum.update({
        where: { id: cineforumId },
        data: {
          ...(botToken !== undefined && {
            telegramBotToken: botToken.trim() || null,
          }),
          ...(chatId !== undefined && {
            telegramChatId: chatId.trim() || null,
          }),
        },
      });

      return res.status(200).json({ ok: true });
    }

    // POST — send a test message
    const cineforum = await prisma.cineforum.findUnique({
      where: { id: cineforumId },
      select: { name: true, telegramBotToken: true, telegramChatId: true },
    });
    if (!cineforum) return res.status(404).json({ error: "Not found" });

    if (!cineforum.telegramBotToken || !cineforum.telegramChatId) {
      return res
        .status(422)
        .json({ error: "Telegram credentials not configured" });
    }

    await telegramNotify(
      `✅ *Test notifica* — ${cineforum.name}\nLe notifiche Telegram sono configurate correttamente!`,
      cineforum.telegramBotToken,
      cineforum.telegramChatId,
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[notifications API] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
