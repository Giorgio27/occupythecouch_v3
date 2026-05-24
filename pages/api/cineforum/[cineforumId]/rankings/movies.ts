import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getMovieRankings } from "@/lib/server/rankings/movies";
import type { MoviesRankingResponseDTO } from "@/lib/shared/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MoviesRankingResponseDTO | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId } = req.query;
  if (typeof cineforumId !== "string") {
    return res.status(400).json({ error: "Invalid cineforumId" });
  }

  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = typeof req.query.search === "string" ? req.query.search : "";

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
  });
  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const { body, total } = await getMovieRankings(cineforumId, offset, limit, search);
    const status = offset + limit >= total ? "completed" : "progress";
    return res.status(200).json({ body, status });
  } catch (error) {
    console.error("Error in GET /api/cineforum/[cineforumId]/rankings/movies:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
