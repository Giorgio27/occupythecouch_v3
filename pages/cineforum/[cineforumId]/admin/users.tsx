import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { GetServerSideProps } from "next";
import CineforumLayout from "@/components/CineforumLayout";
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
import { UserPlus, Shield, User, Ban, Crown, UserCheck, CalendarDays } from "lucide-react";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";

interface UsersAdminPageProps {
  cineforumId: string;
  cineforumName: string;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }

  return {
    props: {
      ...cineforumProps.props,
    },
  };
};

export default function CineforumUsersAdminPage({
  cineforumId,
  cineforumName,
}: UsersAdminPageProps) {
  const { t, i18n } = useTranslation("admin");
  const { isAdmin, isLoading, session } = useAdminAccess(cineforumId);

  const [users, setUsers] = React.useState<CineforumUserDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actioningUserId, setActioningUserId] = React.useState<string | null>(
    null,
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
    } catch (e: unknown) {
      console.error(e);
      const err = e as { message?: string };
      setError(err.message ?? t("users.loading"));
    } finally {
      setLoading(false);
    }
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!cineforumId) return;
    if (!email || !password) {
      setError(t("users.emailLabel") + " / " + t("users.passwordLabel"));
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
    } catch (e: unknown) {
      console.error(e);
      const err = e as { message?: string };
      setError(err.message ?? t("users.inviteButton"));
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
    } catch (e: unknown) {
      console.error(e);
      const err = e as { message?: string };
      setError(err.message ?? t("users.makeAdmin"));
    } finally {
      setActioningUserId(null);
    }
  }

  async function onToggleDisabled(userId: string, currentlyDisabled: boolean) {
    if (!cineforumId) return;
    const action = currentlyDisabled ? "enable" : "disable";
    if (!confirm(t("users.confirmToggle", { action }))) {
      return;
    }
    setActioningUserId(userId);
    setError(null);
    try {
      await toggleUserDisabled(cineforumId, userId, !currentlyDisabled);
      await loadUsers();
    } catch (e: unknown) {
      console.error(e);
      const err = e as { message?: string };
      setError(err.message ?? t("users.disable"));
    } finally {
      setActioningUserId(null);
    }
  }

  if (isLoading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          {t("users.loading")}
        </div>
      </CineforumLayout>
    );
  }

  // If not admin, the hook will redirect, but show nothing while redirecting
  if (!isAdmin) {
    return null;
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("users.pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("users.pageSubtitle")}
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
              {t("users.inviteCardTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onInvite} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="user-email">{t("users.emailLabel")}</Label>
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
                  <Label htmlFor="user-name">{t("users.nameLabel")}</Label>
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
                  <Label htmlFor="user-password">
                    {t("users.passwordLabel")}
                  </Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("users.passwordPlaceholder")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-role">{t("users.roleLabel")}</Label>
                  <select
                    id="user-role"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "ADMIN" | "MEMBER")
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="MEMBER">{t("users.roleMember")}</option>
                    <option value="ADMIN">{t("users.roleAdmin")}</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={inviting}
                className="w-full md:w-auto"
              >
                {inviting ? t("users.inviting") : t("users.inviteButton")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("users.membersTitle", { count: users.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                {t("users.noUsers")}
              </p>
            )}

            {loading && (
              <p className="text-sm text-muted-foreground">
                {t("users.loading")}
              </p>
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
                      user.disabled && "opacity-60",
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
                            {t("users.roleOwner")}
                          </span>
                        )}
                        {!user.isOwner && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              user.role === "ADMIN"
                                ? "border-blue-100 bg-blue-50 text-blue-700"
                                : "border-gray-100 bg-gray-50 text-gray-700",
                            )}
                          >
                            {user.role === "ADMIN" ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {user.role === "ADMIN"
                              ? t("users.roleAdmin")
                              : t("users.roleMember")}
                          </span>
                        )}
                        {user.disabled && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                            <Ban className="h-3 w-3" />
                            {t("users.roleDisabled")}
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground">
                            {t("users.youLabel")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{user.email}</span>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 shrink-0" />
                          {t("users.joinedLabel")}{" "}
                          {new Date(user.joinedAt).toLocaleDateString(
                            i18n.language,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
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
                            {isActioning ? "..." : t("users.makeAdmin")}
                          </Button>
                        )}
                        {!user.disabled && user.role === "ADMIN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateRole(user.id, "MEMBER")}
                            disabled={isActioning}
                          >
                            {isActioning ? "..." : t("users.makeMember")}
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
                                : "text-red-600 hover:bg-red-50 hover:text-red-700",
                            )}
                          >
                            {user.disabled ? (
                              <>
                                <UserCheck className="h-4 w-4" />
                                <span className="ml-1">
                                  {t("users.enable")}
                                </span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4" />
                                <span className="ml-1">
                                  {t("users.disable")}
                                </span>
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
    </CineforumLayout>
  );
}
