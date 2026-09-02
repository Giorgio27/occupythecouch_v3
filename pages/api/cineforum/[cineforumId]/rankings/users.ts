import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getUserRankings } from "@/lib/server/rankings/users";
import type { UsersRankingResponseDTO } from "@/lib/shared/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UsersRankingResponseDTO | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId } = req.query;
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 10;

  if (typeof cineforumId !== "string") {
    return res.status(400).json({ error: "Invalid cineforumId" });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
  });
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this cineforum" });
  }

  try {
    const { body, total, totalMoviesVoted } = await getUserRankings(
      cineforumId,
      offset,
      limit,
    );
    const status = offset + limit >= total ? "completed" : "progress";

    return res.status(200).json({
      body,
      status,
      total_movies_voted: totalMoviesVoted,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/cineforum/[cineforumId]/rankings/users:",
      error,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
