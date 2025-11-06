import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const callbackUrl = (router.query.callbackUrl as string) || "/";
  const errorQuery = router.query.error as string | undefined;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!errorQuery) return;
    setError(
      errorQuery === "CredentialsSignin" ? "Credenziali non valide" : errorQuery
    );
  }, [errorQuery]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setSubmitting(false);

    if (!res) return;
    if (res.ok) router.push(callbackUrl);
    else setError("Credenziali non valide");
  }

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Accedi</CardTitle>
          <p className="text-sm text-muted-foreground">
            Entra per vedere i tuoi cineforum o crearne di nuovi.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showPw ? "Nascondi password" : "Mostra password"}
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Accesso in corso…" : "Accedi"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Non hai un account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium underline underline-offset-4"
            >
              Registrati
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
