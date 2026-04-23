import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || t("signup.signupFailed"));
      }

      // Optional: auto-login after signup
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (loginRes?.ok) router.push("/");
      else router.push("/auth/signin");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("signup.signupFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{t("signup.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("signup.subtitle")}
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
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder={t("signup.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("signup.emailPlaceholder")}
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={
                    showPw ? t("signup.hidePassword") : t("signup.showPassword")
                  }
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
              {submitting ? t("signup.submitting") : t("signup.submit")}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("signup.hasAccount")}{" "}
            <Link
              href="/auth/signin"
              className="font-medium underline underline-offset-4"
            >
              {t("signup.signinLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
