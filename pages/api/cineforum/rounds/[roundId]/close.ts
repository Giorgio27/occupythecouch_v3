// pages/api/cineforum/rounds/[roundId]/close.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { closeRound } from "@/lib/rounds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { roundId } = req.query;
  if (!roundId || typeof roundId !== "string") {
    return res.status(400).json({ error: "roundId is required" });
  }

  try {
    const round = await closeRound(roundId);
    return res.status(200).json(round);
  } catch (e: any) {
    console.error("POST /api/cineforum/rounds/[roundId]/close error", e);

    if (e?.code === "ROUND_NOT_READY") {
      return res.status(400).json({
        error: e.message,
        details: e.details,
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}
