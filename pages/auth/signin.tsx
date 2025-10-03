import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const error = router.query.error as string | undefined;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);

    if (!res) return;
    if (res.ok) {
      router.push("/");
    }
  }

  const errorMessage =
    error === "CredentialsSignin"
      ? "Credenziali non valide"
      : error
      ? error
      : undefined;

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-4">Accedi</h1>

      {errorMessage && (
        <p className="text-red-600 text-sm mb-2">{errorMessage}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Accesso in corso..." : "Accedi"}
        </Button>
      </form>

      <p className="mt-4 text-sm">
        Non hai un account?{" "}
        <Link href="/auth/signup" className="text-blue-600 hover:underline">
          Registrati
        </Link>
      </p>
    </div>
  );
}
