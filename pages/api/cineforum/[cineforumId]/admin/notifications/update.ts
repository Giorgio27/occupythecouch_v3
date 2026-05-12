// pages/api/cineforum/[cineforumId]/admin/notifications/update.ts — PUT
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
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

  const { botToken, chatId, locale } = req.body as {
    botToken?: string;
    chatId?: string;
    locale?: string;
  };

  const validLocales = ["it", "en"];

  try {
    await prisma.cineforum.update({
      where: { id: cineforumId },
      data: {
        ...(botToken !== undefined && {
          telegramBotToken: botToken.trim() || null,
        }),
        ...(chatId !== undefined && {
          telegramChatId: chatId.trim() || null,
        }),
        ...(locale !== undefined &&
          validLocales.includes(locale) && { locale }),
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[notifications PUT] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
