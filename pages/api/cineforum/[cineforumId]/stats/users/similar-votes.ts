import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getCommonMovieVotes } from "@/lib/server/stats/similar-users";

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

  const { cineforumId, userId, otherUserId } = req.query;

  if (typeof cineforumId !== "string") {
    return res.status(400).json({ error: "Invalid cineforumId" });
  }

  if (typeof userId !== "string") {
    return res.status(400).json({ error: "Invalid userId" });
  }

  if (typeof otherUserId !== "string") {
    return res.status(400).json({ error: "Invalid otherUserId" });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
  });

  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const body = await getCommonMovieVotes(cineforumId, userId, otherUserId);
    return res.status(200).json({ body, status: "completed" });
  } catch (error) {
    console.error("Error in GET /stats/users/similar-votes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
