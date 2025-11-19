import * as React from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MovieSearch from "./MovieSearch";
import SelectedMovies from "./SelectedMovies";

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

  // 🔑 use the real logged user id as default owner (user)
  React.useEffect(() => {
    if (session?.user && "id" in session.user && session.user.id) {
      setOwner({ id: session.user.id as string, type: "User" });
    }
  }, [session]);

  function toggleMovie(m: any) {
    setSelected((prev) =>
      prev.some((x) => x.id === m.id)
        ? prev.filter((x) => x.id !== m.id)
        : [...prev, m]
    );
  }

  async function submitCreate() {
    if (!owner || !title || !description || !date || selected.length === 0) {
      alert("Fill all fields and select at least one movie");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/cineforum/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cineforumId,
          date,
          candidate: owner,
          title,
          description,
          proposal: selected,
        }),
      });
      if (!res.ok) throw new Error();
      location.reload();
    } catch {
      alert("Creation failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a new proposal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Search a movie</Label>
          <MovieSearch onResults={setResults} />
          <div className="mt-2 grid grid-cols-1 gap-2">
            {results.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMovie(m)}
                className="flex items-center gap-3 rounded-md border p-2 text-left"
              >
                {m.i?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    src={m.i[0]}
                    className="h-12 w-8 rounded object-cover"
                  />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {m.l} {m.y ? `(${m.y})` : ""}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.s}
                  </div>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {selected.some((x) => x.id === m.id)
                    ? "Selected"
                    : "Tap to add"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <SelectedMovies items={selected} />

        <div className="pt-2">
          <Button
            onClick={submitCreate}
            disabled={creating || selected.length === 0 || !owner}
          >
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
