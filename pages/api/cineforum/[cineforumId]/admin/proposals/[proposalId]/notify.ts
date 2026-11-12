// POST — resend the "new proposal" Telegram message (admin only)
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { notifyProposalCreated } from "@/lib/server/proposals/proposal-created-notification";

const ADMIN_ROLES = ["ADMIN", "OWNER"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { cineforumId, proposalId } = req.query;
  if (typeof cineforumId !== "string" || typeof proposalId !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId, cineforumId } },
    select: { role: true, disabled: true },
  });
  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!ADMIN_ROLES.includes(membership.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const result = await notifyProposalCreated(cineforumId, proposalId);
    if (result === "not_configured") {
      return res.status(422).json({ error: "Telegram credentials not configured" });
    }
    if (result === "failed") {
      return res.status(502).json({ error: "Telegram rejected the message" });
    }
    return res.status(200).json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "PROPOSAL_NOT_FOUND") {
      return res.status(404).json({ error: "Proposal not found" });
    }
    console.error("[admin proposals notify] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
