// pages/api/cineforum/rounds/[roundId]/close.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { closeRound } from "@/lib/server/rounds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Method guard
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  // 2. Auth check
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 3. Param validation
  const { roundId } = req.query;
  if (!roundId || typeof roundId !== "string") {
    return res.status(400).json({ error: "roundId is required" });
  }

  // 4. Fetch round to get cineforumId for membership check
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    select: { cineforumId: true },
  });
  if (!round) {
    return res.status(404).json({ error: "Round not found" });
  }

  // 5. Membership check + admin check
  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: session.user.id,
        cineforumId: round.cineforumId,
      },
    },
  });
  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!["ADMIN", "OWNER"].includes(membership.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const result = await closeRound(roundId);
    return res.status(200).json(result);
  } catch (e: unknown) {
    console.error("POST /api/cineforum/rounds/[roundId]/close error", e);

    const err = e as { code?: string; message?: string; details?: unknown };
    if (err?.code === "ROUND_NOT_READY") {
      return res.status(400).json({
        error: err.message,
        details: err.details,
      });
    }
    if (err?.code === "ROUND_ALREADY_CLOSED") {
      return res.status(409).json({ error: err.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}
