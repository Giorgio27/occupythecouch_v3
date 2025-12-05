import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { Team } from "@/lib/client/cineforum/admin-teams";
import { adminTeamsClient } from "@/lib/client/cineforum/admin-teams";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminTeamsPageProps {
  initialTeams: Team[];
  initialStatus: "progress" | "completed";
  users: { id: string; name?: string; email?: string }[];
}

export default function AdminTeamsPage({
  initialTeams,
  initialStatus,
  users,
}: AdminTeamsPageProps) {
  const router = useRouter();
  const { cineforumId } = router.query;
  const { isAdmin } = useAdminAccess(cineforumId as string);

  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [status, setStatus] = useState<"progress" | "completed">(initialStatus);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create team state
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedTeamUsers, setSelectedTeamUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      router.push(`/cineforum/${cineforumId}`);
    }
  }, [isAdmin, cineforumId, router]);

  const handleLoadMore = async () => {
    if (!cineforumId) return;

    setLoading(true);
    setError(null);
    try {
      const nextOffset = offset + 10;
      const response = await adminTeamsClient.listTeams(cineforumId as string, {
        offset: nextOffset,
      });

      setTeams((prev) => [...prev, ...response.body]);
      setOffset(nextOffset);
      setStatus(response.status);
    } catch (err) {
      setError("Failed to load more teams");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!cineforumId || !newTeamName || selectedTeamUsers.length === 0) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newTeam = await adminTeamsClient.createTeam(cineforumId as string, {
        teamName: newTeamName,
        teamUsers: selectedTeamUsers.map((id) => ({ id })),
      });

      // Reset form
      setNewTeamName("");
      setSelectedTeamUsers([]);

      // Add new team to the top of the list
      setTeams((prev) => [newTeam, ...prev]);
    } catch (err) {
      setError("Failed to create team");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Teams</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-4">Create New Team</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team for your cineforum
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamName" className="text-right">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamUsers" className="text-right">
                Team Members
              </Label>
              <div className="col-span-3 flex flex-col gap-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={user.id}
                      checked={selectedTeamUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeamUsers([...selectedTeamUsers, user.id]);
                        } else {
                          setSelectedTeamUsers(
                            selectedTeamUsers.filter((id) => id !== user.id)
                          );
                        }
                      }}
                    />
                    {user.name || user.email}
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreateTeam}
              disabled={
                loading || !newTeamName || selectedTeamUsers.length === 0
              }
            >
              Create Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(team.created_at).toLocaleDateString()}
              </p>
              {team.round && (
                <p>
                  <strong>Round:</strong> {team.round.name}
                </p>
              )}
              <div className="mt-2">
                <h4 className="font-semibold">Team Members:</h4>
                <ul className="list-disc pl-5">
                  {team.users.map((user) => (
                    <li key={user.id}>{user.name || user.email}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {status === "progress" && (
        <div className="text-center mt-4">
          <Button onClick={handleLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More Teams"}
          </Button>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const cineforumId = context.params?.cineforumId as string;

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  // Check if user is admin or owner of this cineforum
  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: (session.user as any).id,
        cineforumId,
      },
    },
  });

  if (!membership || !["ADMIN", "OWNER"].includes(membership.role)) {
    return {
      redirect: {
        destination: `/cineforum/${cineforumId}`,
        permanent: false,
      },
    };
  }

  // Fetch initial teams
  const initialTeams = await prisma.team.findMany({
    where: { cineforumId },
    orderBy: { createdAt: "desc" },
    take: 10,
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

  // Check total count to determine status
  const totalCount = await prisma.team.count({
    where: { cineforumId },
  });

  // Fetch all users in this cineforum
  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          cineforumId,
          disabled: false,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return {
    props: {
      initialTeams: initialTeams.map((team) => ({
        id: team.id,
        name: team.name,
        created_at: team.createdAt.toISOString(),
        round_id: team.roundId,
        round: team.round
          ? {
              id: team.round.id,
              name: team.round.name,
            }
          : null,
        users: team.users.map((tu) => ({
          id: tu.user.id,
          name: tu.user.name,
          email: tu.user.email,
        })),
      })),
      initialStatus:
        initialTeams.length < totalCount ? "progress" : "completed",
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
    },
  };
};
