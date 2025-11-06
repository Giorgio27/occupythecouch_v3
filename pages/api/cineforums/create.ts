import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const { name, description } = (req.body ?? {}) as {
    name?: string;
    description?: string;
  };
  if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

  // Create cineforum + membership OWNER
  const cf = await prisma.cineforum.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      owner: { connect: { id: session.user.id } },
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    select: { id: true },
  });

  return res.status(201).json({ ok: true, id: cf.id });
}
