// pages/api/cineforum/rounds/create.ts — POST /api/cineforum/rounds/create
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { createRound } from "@/lib/server/rounds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId, name, date, chooserUserId } = req.body || {};

  if (!cineforumId || !name || !date) {
    return res.status(400).json({
      error: "cineforumId, name and date are required",
    });
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: { userId: session.user.id, cineforumId },
    },
  });
  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!["ADMIN", "OWNER"].includes(membership.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const round = await createRound({
      cineforumId,
      name,
      date,
      chooserUserId: chooserUserId || null,
    });

    return res.status(201).json(round);
  } catch (e: unknown) {
    console.error("POST /api/cineforum/rounds/create error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
