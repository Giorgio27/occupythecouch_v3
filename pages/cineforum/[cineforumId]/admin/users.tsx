import * as React from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/client/utils";
import type { CineforumUserDTO } from "@/lib/shared/types";
import {
  fetchCineforumUsers,
  inviteUser,
  updateUserRole,
  toggleUserDisabled,
} from "@/lib/client/cineforum/users";
import { UserPlus, Shield, User, Ban, Crown, UserCheck } from "lucide-react";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";

export default function CineforumUsersAdminPage() {
  const router = useRouter();
  const cineforumId = router.query.cineforumId as string | undefined;
  const { isAdmin, isLoading, session } = useAdminAccess(cineforumId);

  const [users, setUsers] = React.useState<CineforumUserDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actioningUserId, setActioningUserId] = React.useState<string | null>(
    null
  );

  // form state
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "MEMBER">("MEMBER");

  React.useEffect(() => {
    if (!cineforumId || !isAdmin) return;
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cineforumId, isAdmin]);

  async function loadUsers() {
    if (!cineforumId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCineforumUsers(cineforumId);
      setUsers(data.users);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error loading users");
    } finally {
      setLoading(false);
    }
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!cineforumId) return;
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setInviting(true);
    setError(null);
    try {
      await inviteUser(cineforumId, {
        email,
        name: name || undefined,
        password,
        role,
      });
      setEmail("");
      setName("");
      setPassword("");
      setRole("MEMBER");
      await loadUsers();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error inviting user");
    } finally {
      setInviting(false);
    }
  }

  async function onUpdateRole(userId: string, newRole: "ADMIN" | "MEMBER") {
    if (!cineforumId) return;
    setActioningUserId(userId);
    setError(null);
    try {
      await updateUserRole(cineforumId, userId, newRole);
      await loadUsers();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error updating user role");
    } finally {
      setActioningUserId(null);
    }
  }

  async function onToggleDisabled(userId: string, currentlyDisabled: boolean) {
    if (!cineforumId) return;
    const action = currentlyDisabled ? "enable" : "disable";
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }
    setActioningUserId(userId);
    setError(null);
    try {
      await toggleUserDisabled(cineforumId, userId, !currentlyDisabled);
      await loadUsers();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? `Error ${action}ing user`);
    } finally {
      setActioningUserId(null);
    }
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">Users admin</h1>
          <p className="text-sm text-muted-foreground">
            Manage users for this cineforum: invite new members, change roles,
            and remove users.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Invite user form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              Invite new user
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onInvite} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="user-email">Email *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-name">Name</Label>
                  <Input
                    id="user-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="user-password">Password *</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a temporary password for the user
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-role">Role *</Label>
                  <select
                    id="user-role"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "ADMIN" | "MEMBER")
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={inviting}
                className="w-full md:w-auto"
              >
                {inviting ? "Inviting..." : "Invite user"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Members ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                No users yet. Invite the first one above.
              </p>
            )}

            {loading && (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            )}

            <div className="flex flex-col gap-3">
              {users.map((user) => {
                const isActioning = actioningUserId === user.id;
                const currentUserId = (session?.user as any)?.id;
                const isCurrentUser = user.id === currentUserId;

                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-md border bg-card p-3 text-sm md:flex-row md:items-center",
                      user.disabled && "opacity-60"
                    )}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {user.name || user.email}
                        </span>
                        {user.isOwner && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                            <Crown className="h-3 w-3" />
                            Owner
                          </span>
                        )}
                        {!user.isOwner && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              user.role === "ADMIN"
                                ? "border-blue-100 bg-blue-50 text-blue-700"
                                : "border-gray-100 bg-gray-50 text-gray-700"
                            )}
                          >
                            {user.role === "ADMIN" ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {user.role === "ADMIN" ? "Admin" : "Member"}
                          </span>
                        )}
                        {user.disabled && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                            <Ban className="h-3 w-3" />
                            Disabled
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                        {user.name && user.name !== user.email && (
                          <>
                            <span className="mx-1">·</span>
                            <span>
                              Joined{" "}
                              {new Date(user.joinedAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {!user.isOwner && (
                      <div className="flex gap-2">
                        {!user.disabled && user.role === "MEMBER" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateRole(user.id, "ADMIN")}
                            disabled={isActioning}
                          >
                            {isActioning ? "..." : "Make admin"}
                          </Button>
                        )}
                        {!user.disabled && user.role === "ADMIN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateRole(user.id, "MEMBER")}
                            disabled={isActioning}
                          >
                            {isActioning ? "..." : "Make member"}
                          </Button>
                        )}
                        {!isCurrentUser && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onToggleDisabled(user.id, user.disabled)
                            }
                            disabled={isActioning}
                            className={cn(
                              user.disabled
                                ? "text-green-600 hover:bg-green-50 hover:text-green-700"
                                : "text-red-600 hover:bg-red-50 hover:text-red-700"
                            )}
                          >
                            {user.disabled ? (
                              <>
                                <UserCheck className="h-4 w-4" />
                                <span className="ml-1">Enable</span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4" />
                                <span className="ml-1">Disable</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
