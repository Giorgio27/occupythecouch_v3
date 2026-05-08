// pages/api/user/profile/update.ts — PUT /api/user/profile/update
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, image } = req.body as {
    name?: string;
    image?: string;
  };

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      ok: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento del profilo:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
