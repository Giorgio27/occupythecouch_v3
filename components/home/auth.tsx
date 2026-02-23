"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCineforum } from "@/lib/client/cineforum";
import { CineforumDTO } from "@/lib/shared/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDesc,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clapperboard,
  Copy,
  Film,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";

type ViewMode = "grid" | "list";

export function AuthedHome({ cineforums }: { cineforums: CineforumDTO[] }) {
  const router = useRouter();

  const wrapRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  // Create dialog state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Spotlight follow-mouse (usa la tua .bg-spotlight in globals.css)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...cineforums].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter((c) => {
      const d = (c.description ?? "").toLowerCase();
      return c.name.toLowerCase().includes(q) || d.includes(q);
    });
  }, [cineforums, query]);

  const total = cineforums.length;

  async function onCreate() {
    setError(null);
    const clean = name.trim();
    if (clean.length < 2) {
      setError("Dai un nome un filo più lungo (min 2 caratteri).");
      return;
    }

    try {
      await createCineforum({ name: clean });

      setJustCreated(true);
      setTimeout(() => setJustCreated(false), 1600);

      setOpen(false);
      setName("");

      // refresh (App Router). fallback: reload.
      startTransition(() => {
        try {
          router.refresh?.();
        } catch {
          window.location.reload();
        }
      });
    } catch (err: any) {
      setError(err?.message ?? "Errore durante la creazione del cineforum.");
    }
  }

  async function copyCineforumLink(id: string) {
    try {
      const url = `${window.location.origin}/cineforum/${id}`;
      await navigator.clipboard.writeText(url);
      setJustCreated(true);
      setTimeout(() => setJustCreated(false), 1200);
    } catch {
      // niente drama: ignora se clipboard non disponibile
    }
  }

  const namePresets = [
    "Venerdì Noir",
    "Cinema & Pizza",
    "Anime Night",
    "A24 Club",
    "Notti in città",
    "Horror & Popcorn",
  ];

  return (
    <TooltipProvider delayDuration={120}>
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-2xl border border-border bg-background/60 p-4 sm:p-6 lg:p-8"
      >
        <div className="relative space-y-6">
          {/* Header / Hero */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Un posto solo per scegliere, votare, discutere.</span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                <span className="text-gradient-animated">I tuoi cineforum</span>
              </h2>

              <p className="max-w-2xl text-sm text-muted-foreground">
                Entra in un cineforum esistente oppure creane uno nuovo. Tutto
                con micro-interazioni e zero attrito.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary" className="gap-1">
                  <Clapperboard className="h-3.5 w-3.5" />
                  {total} {total === 1 ? "cineforum" : "cineforum"}
                </Badge>

                {justCreated && (
                  <Badge className="gap-1 animate-pop-in">
                    <Check className="h-3.5 w-3.5" />
                    Fatto
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:min-w-[420px] sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca per nome o descrizione…"
                  className="pl-9 bg-card/50 backdrop-blur"
                />
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <div className="flex items-center gap-1 rounded-full border bg-card/40 p-1 backdrop-blur">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={view === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setView("grid")}
                        aria-label="Vista griglia"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Griglia</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={view === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setView("list")}
                        aria-label="Vista lista"
                      >
                        <LayoutList className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Lista</TooltipContent>
                  </Tooltip>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 rounded-full animate-shine">
                      <Plus className="h-4 w-4" />
                      Crea
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Clapperboard className="h-5 w-5 text-primary" />
                        Crea un nuovo cineforum
                      </DialogTitle>
                      <DialogDesc>
                        Un nome chiaro = inviti più facili. Puoi cambiare tutto
                        dopo.
                      </DialogDesc>
                    </DialogHeader>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Nome</label>
                          <span className="text-xs text-muted-foreground">
                            {name.trim().length}/40
                          </span>
                        </div>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value.slice(0, 40))}
                          placeholder="Es. Venerdì Noir"
                          className="bg-card/60"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              onCreate();
                            }
                          }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {namePresets.map((p) => (
                          <Button
                            key={p}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setName(p)}
                          >
                            {p}
                          </Button>
                        ))}
                      </div>

                      {error && (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in">
                          {error}
                        </div>
                      )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="rounded-full"
                      >
                        Annulla
                      </Button>
                      <Button
                        type="button"
                        onClick={onCreate}
                        disabled={isPending}
                        className="rounded-full gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {isPending ? "Creazione…" : "Crea cineforum"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <Separator className="opacity-60" />

          {/* Content */}
          {filtered.length === 0 ? (
            <Card className="bg-card/40 backdrop-blur animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clapperboard className="h-5 w-5 text-primary" />
                  Nessun cineforum trovato
                </CardTitle>
                <CardDescription>
                  {total === 0
                    ? "Crea il tuo primo cineforum e invita amici: il resto viene da sé."
                    : "Prova a cambiare la ricerca o crea un nuovo cineforum."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <HintCard
                    icon={<Plus className="h-4 w-4" />}
                    title="Crea"
                    desc="Dagli un nome riconoscibile."
                  />
                  <HintCard
                    icon={<Users className="h-4 w-4" />}
                    title="Invita"
                    desc="Condividi il link con il gruppo."
                  />
                  <HintCard
                    icon={<CalendarClock className="h-4 w-4" />}
                    title="Vota"
                    desc="Proposte, ranking, decisione."
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="rounded-full gap-2"
                    onClick={() => setOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Crea un cineforum
                  </Button>
                  {total > 0 && (
                    <Button
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => setQuery("")}
                    >
                      Pulisci ricerca
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div
              className={[
                view === "grid"
                  ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-3",
                "animate-fade-in-up",
              ].join(" ")}
            >
              {filtered.map((cf, idx) => (
                <Link
                  key={cf.id}
                  href={`/cineforum/${cf.id}`}
                  className="group block"
                  style={{ animationDelay: `${Math.min(idx * 60, 420)}ms` }}
                >
                  <Card className="relative overflow-hidden bg-card/40 backdrop-blur transition-all duration-300 hover:shadow-lg hover:shadow-[color:var(--cine-red-glow)] hover:border-[color:color-mix(in_srgb,var(--primary)_50%,transparent)] hover-lift">
                    {/* tiny glow strip */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[color:var(--primary)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/40 text-primary glow-red-soft">
                            <Clapperboard className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <CardTitle className="truncate flex items-center gap-2">
                              <span className="truncate">{cf.name}</span>
                              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-70 group-hover:translate-x-0" />
                            </CardTitle>

                            <CardDescription className="line-clamp-2">
                              {cf.description || "Nessuna descrizione"}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full opacity-80 hover:opacity-100"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              aria-label="Azioni"
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-52"
                            onClick={(e) => {
                              // evita click-through al Link
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <DropdownMenuItem
                              onClick={() => copyCineforumLink(cf.id)}
                              className="gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copia link
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              disabled
                              className="gap-2 opacity-70"
                            >
                              <Film className="h-4 w-4" />
                              Impostazioni (coming soon)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {cf._count?.memberships ?? 0} membri
                        </Badge>

                        <Badge variant="secondary" className="gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {cf._count?.rounds ?? 0} round
                        </Badge>

                        <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="opacity-70">Apri</span>
                          <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function HintCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/30 p-4 backdrop-blur transition hover:border-[color:color-mix(in_srgb,var(--primary)_50%,transparent)] hover:shadow-md hover:shadow-[color:var(--cine-red-glow)]">
      <div className="flex items-center gap-2">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border bg-card/50 text-primary">
          {icon}
        </div>
        <div className="font-medium">{title}</div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}
