import * as React from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Plus,
  Search,
  Sparkles,
  Film,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
      alert("Compila tutti i campi e seleziona almeno un film");
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
      alert("Creazione fallita. Riprova.");
    } finally {
      setCreating(false);
    }
  }

  const isFormValid =
    owner && title && description && date && selected.length > 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Intro header */}
      <div className="cine-card cine-glass relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="cine-badge animate-scale-in">
              <Sparkles className="mr-2 h-4 w-4" />
              Nuovo round
            </div>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
            Crea una <span className="text-gradient">nuova proposta</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Imposta data e descrizione, poi aggiungi i film. Il gruppo voterà e
            avrai un vincitore senza drammi.
          </p>
        </div>
      </div>

      {/* Main form card */}
      <Card className="cine-card border-primary/20 animate-fade-in-up delay-100">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <span>Dettagli della proposta</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Date and Title */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-primary" />
                Data di proiezione
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="cine-input h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Titolo proposta
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Oscar night, Horror Friday…"
                className="cine-input h-11"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Film className="h-4 w-4 text-primary" />
              Descrizione
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi il mood della serata, il tema, o qualsiasi dettaglio che renda speciale questa proposta…"
              className="cine-input min-h-[100px] resize-y"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Puoi scrivere una descrizione dettagliata. Sarà visualizzata in
              modo espandibile.
            </p>
          </div>

          {/* Movie Search Section */}
          <div className="cine-card p-5 bg-muted/30 border-primary/10 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Search className="h-5 w-5 text-primary" />
                Cerca e aggiungi film
              </Label>
              {selected.length > 0 && (
                <div className="cine-badge bg-primary/30 text-primary animate-scale-in">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {selected.length} {selected.length === 1 ? "film" : "film"}
                </div>
              )}
            </div>

            <MovieSearch onResults={setResults} />

            {/* Search Results */}
            {results.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-muted-foreground font-medium">
                  Risultati della ricerca
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-2">
                  {results.map((m) => {
                    const isSelected = selected.some((x) => x.id === m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleMovie(m)}
                        className={`cine-card hover-lift p-3 text-left flex items-center gap-3 transition-all duration-300 ${
                          isSelected
                            ? "border-primary/50 bg-primary/5"
                            : "hover:border-primary/30"
                        }`}
                      >
                        {m.i?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt=""
                            src={m.i[0]}
                            className="h-16 w-11 rounded-md object-cover border border-border/60 shadow-sm"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {m.l} {m.y ? `(${m.y})` : ""}
                          </div>
                          <div className="truncate text-xs text-muted-foreground mt-0.5">
                            {m.s}
                          </div>
                        </div>

                        <div className="ml-auto">
                          {isSelected ? (
                            <div className="cine-badge bg-primary text-primary-foreground">
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              Selezionato
                            </div>
                          ) : (
                            <div className="cine-badge opacity-70">
                              <Plus className="mr-1.5 h-3.5 w-3.5" />
                              Aggiungi
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected Movies Display */}
          <SelectedMovies items={selected} />

          {/* Validation Message */}
          {!isFormValid &&
            (selected.length > 0 || title || description || date) && (
              <div className="cine-card p-3 bg-destructive/10 border-destructive/30 animate-fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-destructive/90">
                    Compila tutti i campi e seleziona almeno un film per
                    continuare
                  </p>
                </div>
              </div>
            )}

          {/* Submit Section */}
          <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Pronto per creare la proposta?
              </p>
              <p className="text-xs text-muted-foreground">
                Serve almeno 1 film. Più scelta = voto più divertente.
              </p>
            </div>

            <Button
              onClick={submitCreate}
              disabled={creating || !isFormValid}
              className="cine-btn h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creazione in corso…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Crea proposta
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
