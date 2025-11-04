import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type CineforumDTO = {
  id: string;
  name: string;
  description: string | null;
  _count?: { memberships: number; rounds: number };
};

type Props =
  | { authed: false }
  | {
      authed: true;
      cineforums: CineforumDTO[];
    };

// Server-side: if logged in, load cineforums via Membership
export async function getServerSideProps(ctx: any) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return { props: { authed: false } };
  }

  const cineforums = await prisma.cineforum.findMany({
    where: { memberships: { some: { userId: session.user.id } } },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { memberships: true, rounds: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { props: { authed: true, cineforums } };
}

export default function Home(props: Props) {
  return (
    <Layout>
      {props.authed ? (
        <AuthedHome cineforums={props.cineforums} />
      ) : (
        <Landing />
      )}
    </Layout>
  );
}

// ---------- Unauthenticated landing (mobile-first) ----------
function Landing() {
  return (
    <section className="mx-auto max-w-2xl space-y-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Il sito per fare il cineforum con gli amici
      </h1>
      <p className="text-muted-foreground">
        Crea il tuo gruppo, proponi film, votate e scegliete cosa vedere.
        Semplice, veloce, insieme.
      </p>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link href="/auth/signin" className="w-full sm:w-auto">
          <Button className="w-full">Log in</Button>
        </Link>
        <Link href="/auth/signup" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full">
            Sign up
          </Button>
        </Link>
      </div>
    </section>
  );
}

// ---------- Authenticated home: list + create ----------
function AuthedHome({ cineforums }: { cineforums: CineforumDTO[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createCineforum(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cineforums/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Creation failed");
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">I tuoi cineforum</h2>
        <p className="text-sm text-muted-foreground">
          Entra in un cineforum esistente oppure creane uno nuovo.
        </p>
      </div>

      {/* Create form (inline, mobile-first) */}
      <Card>
        <CardHeader>
          <CardTitle>Crea un nuovo cineforum</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={createCineforum}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              placeholder="Nome del cineforum"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="sm:max-w-xs"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Creazione…" : "Crea"}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* List */}
      {cineforums.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Non hai ancora cineforum. Creane uno qui sopra.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cineforums.map((cf) => (
            <Link key={cf.id} href={`/cineforum/${cf.id}`} className="block">
              <Card className="transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="truncate">{cf.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="line-clamp-2">
                    {cf.description || "Nessuna descrizione"}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span>Membri: {cf._count?.memberships ?? 0}</span>
                    <span>Round: {cf._count?.rounds ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
