// pages/auth/signin.tsx
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

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
      redirect: false, // gestiamo noi il redirect
    });
    setSubmitting(false);

    if (!res) return; // safety
    if (res.ok) {
      router.push("/"); // vai dove vuoi
    } else {
      // NextAuth aggiunge error in query se redirect:true, qui mostriamo noi
      // puoi settare uno state per un messaggio custom
    }
  }

  const errorMessage =
    error === "CredentialsSignin"
      ? "Credenziali non valide"
      : error
      ? error
      : undefined;

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Accedi</h1>
      {errorMessage && (
        <p style={{ color: "crimson", marginTop: 8 }}>{errorMessage}</p>
      )}
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, marginTop: 16 }}
      >
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: "10px 14px" }}
        >
          {submitting ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Non hai un account? <Link href="/auth/signup">Registrati</Link>
      </p>
    </div>
  );
}
