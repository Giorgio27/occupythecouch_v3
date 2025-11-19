import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

// Returns current user + last created team (like legacy), both scoped to cineforum if provided
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;
  const cineforumId = req.query.cineforumId as string | undefined;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  let team: { id: string; name: string } | null = null;
  const whereTeam: any = cineforumId ? { cineforumId } : {};
  const teams = await prisma.team.findMany({
    where: {
      ...whereTeam,
      users: { some: { userId: id } },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  team = teams.at(-1) ?? null;

  const candidates = [
    { id: user.id, name: user.name ?? "", type: "User" },
    ...(team ? [{ id: team.id, name: team.name, type: "Team" }] : []),
  ];

  return res.status(200).json(candidates);
}
