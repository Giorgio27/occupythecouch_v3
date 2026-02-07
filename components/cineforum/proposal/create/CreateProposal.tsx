import * as React from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Plus, Search, Sparkles } from "lucide-react";
import MovieSearch from "./MovieSearch";
import SelectedMovies from "./SelectedMovies";
import { createProposal } from "@/lib/client/cineforum";

/** Create Proposal block (IMDb search + simple selection + submit) */
export default function CreateProposal({
  cineforumId,
}: {
  cineforumId: string;
}) {
  const { data: session } = useSession();

  const [results, setResults] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState("");
  const [owner, setOwner] = React.useState<{
    id: string;
    type: "User" | "Team";
  } | null>(null);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (session?.user && "id" in session.user && session.user.id) {
      setOwner({ id: session.user.id as string, type: "User" });
    }
  }, [session]);

  function toggleMovie(m: any) {
    setSelected((prev) =>
      prev.some((x) => x.id === m.id)
        ? prev.filter((x) => x.id !== m.id)
        : [...prev, m],
    );
  }

  async function submitCreate() {
    if (!owner || !title || !description || !date || selected.length === 0) {
      alert("Fill all fields and select at least one movie");
      return;
    }
    setCreating(true);
    try {
      await createProposal({
        cineforumId,
        date,
        candidate: owner,
        title,
        description,
        proposal: selected,
      });
      location.reload();
    } catch {
      alert("Creation failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Intro header like landing */}
      <div className="cine-card cine-glass relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="cine-badge">
              <Sparkles className="mr-2 h-4 w-4" />
              Nuovo round
            </div>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
            Crea una <span className="text-gradient">proposal</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Imposta data e descrizione, poi aggiungi i film. Il gruppo voterà e
            avrai un vincitore senza drammi.
          </p>
        </div>
      </div>

      <Card className="cine-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Dettagli proposal
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary/80" />
                Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Oscar night, Horror Friday…"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="2 righe per dire il mood della serata…"
            />
          </div>

          <div className="cine-card p-4 space-y-3">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary/80" />
              Cerca un film
            </Label>

            <MovieSearch onResults={setResults} />

            <div className="mt-2 grid grid-cols-1 gap-2">
              {results.map((m) => {
                const isSelected = selected.some((x) => x.id === m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMovie(m)}
                    className="cine-card hover-lift p-3 text-left flex items-center gap-3"
                  >
                    {m.i?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        src={m.i[0]}
                        className="h-14 w-10 rounded-md object-cover border border-border/60"
                      />
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {m.l} {m.y ? `(${m.y})` : ""}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {m.s}
                      </div>
                    </div>

                    <div className="ml-auto">
                      <span
                        className="cine-badge"
                        style={{ opacity: isSelected ? 1 : 0.6 }}
                      >
                        {isSelected ? "Selected" : "Tap to add"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <SelectedMovies items={selected} />

          <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Serve almeno 1 film. Più scelta = voto più divertente.
            </p>

            <Button
              onClick={submitCreate}
              disabled={creating || selected.length === 0 || !owner}
              className="cine-btn h-11"
            >
              {creating ? "Creating…" : "Create proposal"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
