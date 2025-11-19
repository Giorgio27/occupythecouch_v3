import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { proposalId, lists, userId } = req.body || {};
  // For now, accept a userId from client (replace with session in your app)
  if (!proposalId || !lists || !userId)
    return res.status(400).json({ error: "Missing fields" });

  const movieSelection: Record<string, string[]> = {};
  for (const k of Object.keys(lists)) {
    const arr = (lists[k] || []) as { id: string }[];
    movieSelection[k] = arr.map((m) => m.id);
  }

  await prisma.proposalVote.upsert({
    where: { proposalId_userId: { proposalId, userId } },
    create: { proposalId, userId, movieSelection },
    update: { movieSelection },
  });

  return res.status(201).json({ ok: true });
}
