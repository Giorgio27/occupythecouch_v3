import * as React from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { authOptions } from "./api/auth/[...nextauth]";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
};

type ProfilePageProps = {
  initialProfile: UserProfile;
};

export default function ProfilePage({ initialProfile }: ProfilePageProps) {
  const { data: session, update: updateSession } = useSession();

  // Profile form state
  const [name, setName] = React.useState(initialProfile.name || "");
  const [profileSubmitting, setProfileSubmitting] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Clear success messages after 3 seconds
  React.useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  React.useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => setPasswordSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Errore durante l'aggiornamento del profilo",
        );
      }

      setProfileSuccess(true);
      // Update session with new name - pass the new name to trigger JWT update
      await updateSession({ name });
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Errore sconosciuto",
      );
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSubmitting(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (newPassword.length < 6) {
      setPasswordError("La nuova password deve essere di almeno 6 caratteri");
      setPasswordSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Le password non corrispondono");
      setPasswordSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore durante il cambio password");
      }

      setPasswordSuccess(true);
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Errore sconosciuto",
      );
    } finally {
      setPasswordSubmitting(false);
    }
  }

  const createdDate = new Date(initialProfile.createdAt).toLocaleDateString(
    "it-IT",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profilo Utente</h1>
          <p className="mt-2 text-muted-foreground">
            Gestisci le informazioni del tuo account
          </p>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Informazioni Profilo</CardTitle>
            </div>
            <CardDescription>
              Aggiorna il tuo nome e le informazioni del profilo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Profilo aggiornato con successo</span>
              </div>
            )}
            {profileError && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={initialProfile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L'email non può essere modificata
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Il tuo nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Membro dal</Label>
                <Input
                  type="text"
                  value={createdDate}
                  disabled
                  className="bg-muted"
                />
              </div>

              <Button type="submit" disabled={profileSubmitting}>
                {profileSubmitting ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Cambia Password</CardTitle>
            </div>
            <CardDescription>
              Aggiorna la tua password per mantenere il tuo account sicuro
            </CardDescription>
          </CardHeader>
          <CardContent>
            {passwordSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Password cambiata con successo</span>
              </div>
            )}
            {passwordError && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Password Corrente</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={
                      showCurrentPw ? "Nascondi password" : "Mostra password"
                    }
                    onClick={() => setShowCurrentPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPw ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nuova Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={
                      showNewPw ? "Nascondi password" : "Mostra password"
                    }
                    onClick={() => setShowNewPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPw ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimo 6 caratteri
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirmPw ? "Nascondi password" : "Mostra password"
                    }
                    onClick={() => setShowConfirmPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPw ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting ? "Aggiornamento..." : "Cambia Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/profile",
        permanent: false,
      },
    };
  }

  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/profile`,
      {
        headers: {
          cookie: context.req.headers.cookie || "",
        },
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch profile");
    }

    const profile = await res.json();

    return {
      props: {
        initialProfile: profile,
      },
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
};
