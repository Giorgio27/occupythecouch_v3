import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cineforumId = req.query.cineforumId as string | undefined;
  const where = cineforumId ? { cineforumId } : {};
  const round = await prisma.round.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, closed: true },
  });
  return res.status(200).json(round);
}
