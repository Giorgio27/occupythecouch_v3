import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getMovieDetail, MOVIE_NOT_FOUND } from "@/lib/server/movies";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const { cineforumId, movieId } = req.query;
  if (typeof cineforumId !== "string" || typeof movieId !== "string")
    return res.status(400).json({ error: "Invalid parameters" });

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
    select: { disabled: true },
  });
  if (!membership || membership.disabled)
    return res.status(403).json({ error: "Forbidden" });

  try {
    const detail = await getMovieDetail(cineforumId, movieId, session.user.id);
    return res.status(200).json(detail);
  } catch (e: unknown) {
    const code = (e as { code?: unknown })?.code;
    if (code === MOVIE_NOT_FOUND)
      return res.status(404).json({ error: "Movie not found" });
    console.error(
      "Error in GET /api/cineforum/[cineforumId]/movies/[movieId]:",
      e,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
