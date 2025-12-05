// pages/api/cineforum/[cineforumId]/admin/users/invite.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CineforumRole } from "@prisma/client";

type InviteUserRequest = {
  email: string;
  name?: string;
  password: string;
  role: "ADMIN" | "MEMBER";
};

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

  const { cineforumId } = req.query;
  if (!cineforumId || typeof cineforumId !== "string") {
    return res.status(400).json({ error: "cineforumId is required" });
  }

  const { email, name, password, role } = req.body as InviteUserRequest;

  if (!email || !password || !role) {
    return res.status(400).json({
      error: "email, password, and role are required",
    });
  }

  if (!["ADMIN", "MEMBER"].includes(role)) {
    return res.status(400).json({
      error: "role must be either ADMIN or MEMBER",
    });
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
        error: "You must be an admin or owner to invite users",
      });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create them
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          passwordHash,
        },
      });
    }

    // Check if user is already a member of this cineforum
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_cineforumId: {
          userId: user.id,
          cineforumId,
        },
      },
    });

    if (existingMembership) {
      return res.status(400).json({
        error: "User is already a member of this cineforum",
      });
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        cineforumId,
        role: role as CineforumRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
      user: membership.user,
      createdAt: membership.createdAt,
    });
  } catch (e: any) {
    console.error(
      "POST /api/cineforum/[cineforumId]/admin/users/invite error",
      e
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
