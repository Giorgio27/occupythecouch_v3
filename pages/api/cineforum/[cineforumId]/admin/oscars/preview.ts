// API route: GET /api/cineforum/[cineforumId]/admin/oscars/preview
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getLastOpenOscarRound } from "@/lib/server/oscars";

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

  const { cineforumId } = req.query;
  if (typeof cineforumId !== "string") {
    return res.status(400).json({ error: "Invalid cineforumId" });
  }

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
    const round = await getLastOpenOscarRound(cineforumId, session.user.id);
    return res.status(200).json({ body: round });
  } catch (error) {
    console.error(
      "Error in GET /api/cineforum/[cineforumId]/admin/oscars/preview:",
      error,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
