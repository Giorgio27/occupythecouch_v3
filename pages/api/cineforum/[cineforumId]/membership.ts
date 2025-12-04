// pages/api/cineforum/[cineforumId]/membership.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const { cineforumId } = req.query;
  if (!cineforumId || typeof cineforumId !== "string") {
    return res.status(400).json({ error: "cineforumId is required" });
  }

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_cineforumId: {
          userId: (session.user as any).id,
          cineforumId,
        },
      },
      select: {
        id: true,
        role: true,
        disabled: true,
      },
    });

    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    return res.status(200).json({
      role: membership.role,
      disabled: membership.disabled,
      isAdmin: ["ADMIN", "OWNER"].includes(membership.role),
    });
  } catch (e: any) {
    console.error("GET /api/cineforum/[cineforumId]/membership error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
