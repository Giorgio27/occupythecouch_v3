import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.query.userId as string;
  const cineforumId = req.query.cineforumId as string | undefined;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const whereTeam: any = cineforumId ? { cineforumId } : {};
  const teams = await prisma.team.findMany({
    where: { ...whereTeam, users: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  const candidates = [
    { id: user.id, name: user.name ?? "", type: "User" },
    ...(teams.at(-1)
      ? [
          {
            id: teams.at(-1)!.id,
            name: teams.at(-1)!.name,
            type: "Team" as const,
          },
        ]
      : []),
  ];

  return res.status(200).json(candidates);
}
