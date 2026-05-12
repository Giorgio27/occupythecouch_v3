// pages/api/cineforum/[cineforumId]/admin/notifications/index.ts — GET
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import type { TelegramSettingsDTO } from "@/lib/shared/types/cineforum";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
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
      select: { telegramBotToken: true, telegramChatId: true, locale: true },
    });
    if (!cineforum) return res.status(404).json({ error: "Not found" });

    const payload: TelegramSettingsDTO = {
      botTokenSet: !!cineforum.telegramBotToken,
      chatId: cineforum.telegramChatId,
      locale: cineforum.locale,
    };
    return res.status(200).json(payload);
  } catch (error) {
    console.error("[notifications GET] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
