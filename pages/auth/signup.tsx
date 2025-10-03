// pages/auth/signup.tsx
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(body?.error || "Signup fallito");
      }

      // opzionale: login automatico post-signup
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.ok) router.push("/");
      else router.push("/auth/signin");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Registrati</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, marginTop: 16 }}
      >
        <label>
          Email *
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Password *
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: "10px 14px" }}
        >
          {submitting ? "Creazione..." : "Crea account"}
        </button>
      </form>
    </div>
  );
}
