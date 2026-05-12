// pages/api/cineforum/[cineforumId]/admin/notifications/test.ts — POST
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { telegramNotify } from "@/lib/server/external/telegram";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
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

  try {
    const cineforum = await prisma.cineforum.findUnique({
      where: { id: cineforumId },
      select: {
        name: true,
        telegramBotToken: true,
        telegramChatId: true,
        locale: true,
      },
    });
    if (!cineforum) return res.status(404).json({ error: "Not found" });

    if (!cineforum.telegramBotToken || !cineforum.telegramChatId) {
      console.error(
        `[notifications POST] missing credentials for cineforum ${cineforumId}:`,
        {
          hasBotToken: !!cineforum.telegramBotToken,
          hasChatId: !!cineforum.telegramChatId,
        },
      );
      return res
        .status(422)
        .json({ error: "Telegram credentials not configured" });
    }

    const testText =
      cineforum.locale === "en"
        ? `✅ *Test notification* — ${cineforum.name}\nTelegram notifications are configured correctly!`
        : `✅ *Test notifica* — ${cineforum.name}\nLe notifiche Telegram sono configurate correttamente!`;

    await telegramNotify(
      testText,
      cineforum.telegramBotToken,
      cineforum.telegramChatId,
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[notifications POST] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
