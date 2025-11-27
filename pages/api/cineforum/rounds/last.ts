// pages/api/cineforum/rounds/last.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { cineforumId } = req.query;
  if (!cineforumId || typeof cineforumId !== "string") {
    return res
      .status(400)
      .json({ error: "cineforumId query param is required" });
  }

  try {
    const round = await prisma.round.findFirst({
      where: { cineforumId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    if (!round) return res.status(200).json(null);

    return res.status(200).json(round);
  } catch (e) {
    console.error("GET /api/cineforum/rounds/last error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
