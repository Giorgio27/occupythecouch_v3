// pages/api/cineforum/[cineforumId]/admin/users/index.ts
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
    // Check if current user is admin or owner of this cineforum
    const currentUserMembership = await prisma.membership.findUnique({
      where: {
        userId_cineforumId: {
          userId: (session.user as any).id,
          cineforumId,
        },
      },
    });

    if (
      !currentUserMembership ||
      !["ADMIN", "OWNER"].includes(currentUserMembership.role)
    ) {
      return res.status(403).json({
        error: "You must be an admin or owner to view users",
      });
    }

    // Get all memberships for this cineforum
    const memberships = await prisma.membership.findMany({
      where: { cineforumId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER first, then ADMIN, then MEMBER
        { createdAt: "asc" },
      ],
    });

    // Get cineforum info to identify owner
    const cineforum = await prisma.cineforum.findUnique({
      where: { id: cineforumId },
      select: { ownerId: true },
    });

    const users = memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      membershipId: m.id,
      isOwner: cineforum?.ownerId === m.user.id,
      disabled: m.disabled,
      joinedAt: m.createdAt,
    }));

    return res.status(200).json({ users });
  } catch (e: any) {
    console.error("GET /api/cineforum/[cineforumId]/admin/users error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
