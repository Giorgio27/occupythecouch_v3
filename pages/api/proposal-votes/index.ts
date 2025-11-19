import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const { proposalId, lists } = req.body || {};
  if (!proposalId || !lists)
    return res.status(400).json({ error: "Missing fields" });

  // Normalize lists into { "1": [movieId, ...], "2": [...] }
  const movieSelection: Record<string, string[]> = {};
  for (const k of Object.keys(lists)) {
    const arr = (lists[k] || []) as { id: string }[];
    movieSelection[k] = arr.map((m) => m.id);
  }

  // Upsert one vote per user/proposal
  await prisma.proposalVote.upsert({
    where: { proposalId_userId: { proposalId, userId: session.user.id } },
    create: { proposalId, userId: session.user.id, movieSelection },
    update: { movieSelection },
  });

  return res.status(201).json({ ok: true });
}
