import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cineforumId } = req.query;
  if (!cineforumId || typeof cineforumId !== "string") {
    return res.status(400).json({ error: "cineforumId is required" });
  }

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
      error: "You must be an admin or owner to access admin teams",
    });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case "GET":
      return handleGetTeams(req, res, cineforumId);
    case "POST":
      return handleCreateTeam(req, res, cineforumId);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end();
  }
}

async function handleGetTeams(
  req: NextApiRequest,
  res: NextApiResponse,
  cineforumId: string
) {
  try {
    const { offset = "0", limit = "10" } = req.query;
    const offsetNum = parseInt(offset as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Get total count
    const totalCount = await prisma.team.count({
      where: { cineforumId },
    });

    // Get paginated teams
    const teams = await prisma.team.findMany({
      where: { cineforumId },
      orderBy: { createdAt: "desc" },
      skip: offsetNum,
      take: limitNum,
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        round: true,
      },
    });

    // Determine status
    const status =
      offsetNum + limitNum >= totalCount ? "completed" : "progress";

    // Transform teams to match Ruby serialization
    const serializedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      created_at: team.createdAt,
      round_id: team.roundId,
      round: team.round,
      users: team.users.map((tu) => tu.user),
    }));

    return res.status(200).json({
      body: serializedTeams,
      status,
    });
  } catch (error) {
    console.error("GET teams error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleCreateTeam(
  req: NextApiRequest,
  res: NextApiResponse,
  cineforumId: string
) {
  try {
    const { teamName, teamUsers } = req.body;

    if (!teamName || !teamUsers || !Array.isArray(teamUsers)) {
      return res.status(400).json({
        error: "teamName and teamUsers (array) are required",
      });
    }

    // Find the last open round for this cineforum
    const lastOpenRound = await prisma.round.findFirst({
      where: {
        cineforumId,
        closed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    // Create the team
    const team = await prisma.team.create({
      data: {
        name: teamName,
        cineforumId,
        roundId: lastOpenRound?.id || null,
        users: {
          create: teamUsers.map((user: { id: string }) => ({
            userId: user.id,
          })),
        },
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        round: true,
      },
    });

    // Transform team to match Ruby serialization
    const serializedTeam = {
      id: team.id,
      name: team.name,
      created_at: team.createdAt,
      round_id: team.roundId,
      round: team.round,
      users: team.users.map((tu) => tu.user),
    };

    return res.status(201).json(serializedTeam);
  } catch (error) {
    console.error("Create team error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
