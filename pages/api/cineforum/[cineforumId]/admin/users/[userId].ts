// pages/api/cineforum/[cineforumId]/admin/users/[userId].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { CineforumRole } from "@prisma/client";

type UpdateUserRoleRequest = {
  role: "ADMIN" | "MEMBER";
};

type ToggleDisabledRequest = {
  disabled: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId, userId } = req.query;
  if (!cineforumId || typeof cineforumId !== "string") {
    return res.status(400).json({ error: "cineforumId is required" });
  }
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
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
        error: "You must be an admin or owner to manage users",
      });
    }

    // Get cineforum to check owner
    const cineforum = await prisma.cineforum.findUnique({
      where: { id: cineforumId },
      select: { ownerId: true },
    });

    // Check if target user is the owner
    if (cineforum?.ownerId === userId) {
      return res.status(403).json({
        error: "Cannot modify or disable the cineforum owner",
      });
    }

    if (req.method === "PATCH") {
      const body = req.body;

      // Check if it's a role update or disable toggle
      if ("role" in body) {
        const { role } = body as UpdateUserRoleRequest;

        if (!role || !["ADMIN", "MEMBER"].includes(role)) {
          return res.status(400).json({
            error: "role must be either ADMIN or MEMBER",
          });
        }

        // Update membership role
        const membership = await prisma.membership.update({
          where: {
            userId_cineforumId: {
              userId,
              cineforumId,
            },
          },
          data: {
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

        return res.status(200).json({
          id: membership.id,
          userId: membership.userId,
          role: membership.role,
          disabled: membership.disabled,
          user: membership.user,
        });
      } else if ("disabled" in body) {
        const { disabled } = body as ToggleDisabledRequest;

        // Prevent self-disable
        if (userId === (session.user as any).id) {
          return res.status(400).json({
            error: "Cannot disable yourself",
          });
        }

        // Update membership disabled status
        const membership = await prisma.membership.update({
          where: {
            userId_cineforumId: {
              userId,
              cineforumId,
            },
          },
          data: {
            disabled,
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

        return res.status(200).json({
          id: membership.id,
          userId: membership.userId,
          role: membership.role,
          disabled: membership.disabled,
          user: membership.user,
        });
      } else {
        return res.status(400).json({
          error: "Must provide either 'role' or 'disabled' in request body",
        });
      }
    }

    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end();
  } catch (e: any) {
    console.error(
      `${req.method} /api/cineforum/[cineforumId]/admin/users/[userId] error`,
      e
    );

    if (e.code === "P2025") {
      return res
        .status(404)
        .json({ error: "User not found in this cineforum" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}
