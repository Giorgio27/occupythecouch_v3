import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createCineforum } from "@/lib/client/cineforum";
import { CineforumDTO } from "@/lib/shared/types";

export function AuthedHome({ cineforums }: { cineforums: CineforumDTO[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreateCineforum(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createCineforum({ name });
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
            onSubmit={onCreateCineforum}
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
