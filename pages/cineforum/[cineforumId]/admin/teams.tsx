import { useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import { Team } from "@/lib/client/cineforum/admin-teams";
import { adminTeamsClient } from "@/lib/client/cineforum/admin-teams";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const { isAdmin, isLoading } = useAdminAccess(cineforumId as string);

  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [status, setStatus] = useState<"progress" | "completed">(initialStatus);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create team state
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedTeamUsers, setSelectedTeamUsers] = useState<string[]>([]);

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

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  }

  // If not admin, the hook will redirect, but show nothing while redirecting
  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Teams admin</h1>
          <p className="text-sm text-muted-foreground">
            Manage teams for this cineforum: create new teams and assign
            members.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Create team form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create new team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="teamUsers">Team Members</Label>
                <div className="flex flex-col gap-2 rounded-md border bg-card p-3">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={user.id}
                        checked={selectedTeamUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeamUsers([
                              ...selectedTeamUsers,
                              user.id,
                            ]);
                          } else {
                            setSelectedTeamUsers(
                              selectedTeamUsers.filter((id) => id !== user.id)
                            );
                          }
                        }}
                        className="rounded"
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
                className="w-full md:w-auto"
              >
                {loading ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teams list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teams.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                No teams yet. Create the first one above.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm"
                >
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{team.name}</span>
                      {team.round && (
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          Round: {team.round.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span>
                        Created:{" "}
                        {new Date(team.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <h4 className="text-xs font-semibold text-muted-foreground">
                        Members:
                      </h4>
                      <ul className="mt-1 list-disc pl-5 text-xs">
                        {team.users.map((user) => (
                          <li key={user.id}>{user.name || user.email}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination / load more */}
            {status === "progress" && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
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
