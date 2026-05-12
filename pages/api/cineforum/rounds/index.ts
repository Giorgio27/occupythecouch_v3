// pages/api/cineforum/rounds/index.ts — GET /api/cineforum/rounds
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { listRoundsForCineforum } from "@/lib/server/rounds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId, offset, limit } = req.query;

  if (!cineforumId || typeof cineforumId !== "string") {
    return res
      .status(400)
      .json({ error: "cineforumId query param is required" });
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: { userId: session.user.id, cineforumId },
    },
  });
  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const off = offset ? Number(offset) : 0;
  const lim = limit ? Number(limit) : 10;

  try {
    const data = await listRoundsForCineforum({
      cineforumId,
      offset: off,
      limit: lim,
    });

    return res.status(200).json({
      status: data.status,
      total: data.total,
      rounds: data.items,
    });
  } catch (e: unknown) {
    console.error("GET /api/cineforum/rounds error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
