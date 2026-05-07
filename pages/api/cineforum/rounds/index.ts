// pages/api/cineforum/rounds/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { createRound, listRoundsForCineforum } from "@/lib/server/rounds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Auth check
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const { cineforumId, offset, limit } = req.query;

    if (!cineforumId || typeof cineforumId !== "string") {
      return res
        .status(400)
        .json({ error: "cineforumId query param is required" });
    }

    // 2. Membership check
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

  if (req.method === "POST") {
    const { cineforumId, name, date, chooserUserId } = req.body || {};

    if (!cineforumId || !name || !date) {
      return res.status(400).json({
        error: "cineforumId, name and date are required",
      });
    }

    // 2. Membership check + admin check for POST
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
      console.error("POST /api/cineforum/rounds error", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
