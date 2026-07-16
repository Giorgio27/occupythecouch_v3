import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getGenreStats } from "@/lib/server/rankings/genres";
import type { GenreResponseDTO } from "@/lib/shared/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenreResponseDTO | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId } = req.query as { cineforumId: string };

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
  });
  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const { body, totalFilms } = await getGenreStats(cineforumId);
    return res
      .status(200)
      .json({ body, status: "completed", total_films: totalFilms });
  } catch (error) {
    console.error(
      "Error in GET /api/cineforum/[cineforumId]/rankings/genres:",
      error,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
