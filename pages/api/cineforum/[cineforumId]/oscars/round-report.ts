import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getRoundReport } from "@/lib/server/oscars/round-report";
import type { RoundReportDTO } from "@/lib/shared/types/cineforum";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RoundReportDTO | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId, roundId } = req.query as {
    cineforumId: string;
    roundId?: string;
  };
  if (typeof roundId !== "string" || !roundId) {
    return res.status(400).json({ error: "Missing roundId" });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
  });
  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const body = await getRoundReport(cineforumId, roundId);
    return res.status(200).json({ body, status: "completed" });
  } catch (error) {
    console.error(
      "Error in GET /api/cineforum/[cineforumId]/oscars/round-report:",
      error,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
