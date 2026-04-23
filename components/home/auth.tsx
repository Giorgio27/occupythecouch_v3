"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { createCineforum } from "@/lib/client/cineforum";
import { CineforumDTO } from "@/lib/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Users,
  Vote,
  Popcorn,
} from "lucide-react";

type ViewMode = "grid" | "list";

// Hook per animazioni on scroll
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Floating elements for visual polish
function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute top-10 left-[8%] w-14 h-14 rounded-full border-2 border-primary/20 animate-float opacity-20"
        style={{ animationDelay: "0s" }}
      >
        <div className="absolute inset-2 rounded-full border border-primary/30" />
      </div>
      <div
        className="absolute top-32 right-[12%] w-10 h-10 rounded-full border-2 border-primary/15 animate-float-slow opacity-15"
        style={{ animationDelay: "1s" }}
      >
        <div className="absolute inset-2 rounded-full border border-primary/20" />
      </div>
      <div
        className="absolute bottom-20 left-[15%] w-8 h-8 rounded-full border-2 border-primary/10 animate-float opacity-10"
        style={{ animationDelay: "2s" }}
      />

      {/* Sparkle effects */}
      <div className="absolute top-20 right-[20%] w-2 h-2 bg-primary/30 rounded-full animate-pulse-soft" />
      <div
        className="absolute top-48 left-[25%] w-1.5 h-1.5 bg-primary/20 rounded-full animate-pulse-soft"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute bottom-32 right-[25%] w-2 h-2 bg-primary/25 rounded-full animate-pulse-soft"
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
}

export function AuthedHome({ cineforums }: { cineforums: CineforumDTO[] }) {
  const { t } = useTranslation("cineforum");
  const router = useRouter();
  const heroSection = useInView(0.1);
  const cardsSection = useInView(0.1);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  // Create dialog state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      setError(t("home.nameTooShort"));
      return;
    }

    try {
      await createCineforum({ name: clean });

      setJustCreated(true);
      setTimeout(() => setJustCreated(false), 1600);

      setOpen(false);
      setName("");

      startTransition(() => {
        try {
          router.refresh?.();
        } catch {
          window.location.reload();
        }
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : t("home.createError");
      setError(errorMessage);
    }
  }

  async function copyCineforumLink(id: string) {
    try {
      const url = `${window.location.origin}/cineforum/${id}/proposal`;
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore clipboard errors
    }
  }

  const namePresets = [
    "Venerdi Noir",
    "Cinema & Pizza",
    "Anime Night",
    "A24 Club",
    "Notti in citta",
    "Horror & Popcorn",
  ];

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-175 h-175 bg-primary/8 blur-[150px] rounded-full animate-pulse-soft" />
          <div className="absolute bottom-0 right-0 w-100 h-100 bg-cine-red-soft/5 blur-[120px] rounded-full animate-float-slow" />
          <div className="absolute top-1/2 left-0 w-62.5 h-62.5 bg-primary/3 blur-[100px] rounded-full" />
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-8 pb-8 sm:pt-12 sm:pb-12 md:pt-16 md:pb-16">
          <FloatingElements />

          <div
            ref={heroSection.ref}
            className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
          >
            <div
              className={`transition-all duration-700 ${heroSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              {/* Badge */}
              <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in-down">
                <div className="cine-badge animate-shine group cursor-default text-xs sm:text-sm">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 group-hover:animate-spin-slow" />
                  <span>{t("home.badge")}</span>
                </div>
              </div>

              {/* Main headline */}
              <div className="text-center space-y-4 sm:space-y-6 ">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight sm:leading-tight md:leading-tight text-balance">
                  <span className="inline-block animate-fade-in-up">
                    {t("home.headline1")}
                  </span>
                  <br />
                  <span className="text-gradient inline-block animate-scale-in-bounce delay-200">
                    {t("home.headline2")}
                  </span>
                </h1>

                <p
                  className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-md sm:max-w-lg mx-auto leading-relaxed animate-fade-in-up delay-300 opacity-0 px-2 sm:px-0"
                  style={{ animationFillMode: "forwards" }}
                >
                  {t("home.subtitle")}
                  <br className="hidden sm:block" />
                  <span className="text-foreground/80 font-medium">
                    {t("home.subtitleBold")}
                  </span>
                </p>
              </div>

              {/* Stats row */}
              <div
                className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-10 animate-fade-in-up delay-400 opacity-0"
                style={{ animationFillMode: "forwards" }}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clapperboard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {total}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("home.statLabel")}
                    </p>
                  </div>
                </div>

                {justCreated && (
                  <div className="flex items-center gap-2 animate-pop-in">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-500">
                        {t("home.justCreated")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Controls & Content Section */}
        <section className="pb-16 sm:pb-20 md:pb-28">
          <div
            ref={cardsSection.ref}
            className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
          >
            {/* Controls Bar */}
            <div
              className={`cine-card mb-6 sm:mb-8 transition-all duration-700 ${cardsSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("home.searchPlaceholder")}
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {/* View toggle */}
                  <div className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/30 p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={view === "grid" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setView("grid")}
                          aria-label={t("home.gridAriaLabel")}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("home.gridView")}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={view === "list" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setView("list")}
                          aria-label={t("home.listAriaLabel")}
                        >
                          <LayoutList className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("home.listView")}</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Create button */}
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button className="cine-btn h-10 px-5 text-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("home.createButton")}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-125 border-border/50 bg-card">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Clapperboard className="h-5 w-5 text-primary" />
                          </div>
                          {t("home.dialogTitle")}
                        </DialogTitle>
                        <DialogDesc className="text-muted-foreground">
                          {t("home.dialogDesc")}
                        </DialogDesc>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              {t("home.nameLabel")}
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {name.trim().length}/40
                            </span>
                          </div>
                          <Input
                            value={name}
                            onChange={(e) =>
                              setName(e.target.value.slice(0, 40))
                            }
                            placeholder={t("home.namePlaceholder")}
                            className="bg-secondary/50 border-border/50 focus:border-primary/50"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                onCreate();
                              }
                            }}
                          />
                        </div>

                        {/* Presets */}
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">
                            {t("home.presetsLabel")}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {namePresets.map((p) => (
                              <button
                                key={p}
                                type="button"
                                className="px-3 py-1.5 text-xs rounded-full bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                                onClick={() => setName(p)}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        {error && (
                          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
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
                          {t("home.cancel")}
                        </Button>
                        <Button
                          type="button"
                          onClick={onCreate}
                          disabled={isPending}
                          className="cine-btn"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {isPending ? t("home.creating") : t("home.create")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
              <div
                className={`transition-all duration-700 delay-100 ${cardsSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <EmptyState
                  total={total}
                  onClearSearch={() => setQuery("")}
                  onOpenCreate={() => setOpen(true)}
                />
              </div>
            ) : (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                    : "flex flex-col gap-3"
                }
              >
                {filtered.map((cf, idx) => (
                  <CineforumCard
                    key={cf.id}
                    cineforum={cf}
                    index={idx}
                    isInView={cardsSection.isInView}
                    viewMode={view}
                    copiedId={copiedId}
                    onCopyLink={copyCineforumLink}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}

// Empty state component
function EmptyState({
  total,
  onClearSearch,
  onOpenCreate,
}: {
  total: number;
  onClearSearch: () => void;
  onOpenCreate: () => void;
}) {
  const { t } = useTranslation("cineforum");

  return (
    <div className="cine-card text-center py-12 sm:py-16 md:py-20 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 sm:w-52 h-40 sm:h-52 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Clapperboard className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">
          {total === 0 ? t("empty.firstTitle") : t("empty.noResultsTitle")}
        </h3>

        <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-md mx-auto">
          {total === 0
            ? t("empty.firstSubtitle")
            : t("empty.noResultsSubtitle")}
        </p>

        {/* How it works hints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          {[
            {
              icon: Plus,
              title: t("empty.hint1Title"),
              desc: t("empty.hint1Desc"),
            },
            {
              icon: Users,
              title: t("empty.hint2Title"),
              desc: t("empty.hint2Desc"),
            },
            {
              icon: Vote,
              title: t("empty.hint3Title"),
              desc: t("empty.hint3Desc"),
            },
          ].map((hint, idx) => {
            const Icon = hint.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-sm mb-1">{hint.title}</p>
                <p className="text-xs text-muted-foreground">{hint.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onOpenCreate} className="cine-btn">
            <Plus className="h-4 w-4 mr-2" />
            {t("empty.createButton")}
          </Button>
          {total > 0 && (
            <Button
              variant="outline"
              onClick={onClearSearch}
              className="cine-btn-ghost"
            >
              {t("empty.clearSearch")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Cineforum card component
function CineforumCard({
  cineforum,
  index,
  isInView,
  viewMode,
  copiedId,
  onCopyLink,
}: {
  cineforum: CineforumDTO;
  index: number;
  isInView: boolean;
  viewMode: ViewMode;
  copiedId: string | null;
  onCopyLink: (id: string) => void;
}) {
  const { t } = useTranslation("cineforum");
  const delay = Math.min(index * 80, 400);

  return (
    <Link
      href={`/cineforum/${cineforum.id}`}
      className={`group block transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover-lift ${viewMode === "list" ? "p-4" : "p-5"}`}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Top glow strip */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-60" />

        <div
          className={`relative ${viewMode === "list" ? "flex items-center justify-between gap-4" : ""}`}
        >
          {/* Icon & Content */}
          <div
            className={`${viewMode === "list" ? "flex items-center gap-4 flex-1 min-w-0" : ""}`}
          >
            <div
              className={`inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105 ${viewMode === "list" ? "w-12 h-12 shrink-0" : "w-14 h-14 mb-4"}`}
            >
              <Clapperboard
                className={viewMode === "list" ? "w-5 h-5" : "w-6 h-6"}
              />
            </div>

            <div className={viewMode === "list" ? "min-w-0 flex-1" : ""}>
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-semibold text-foreground truncate group-hover:text-primary transition-colors ${viewMode === "list" ? "text-base" : "text-lg"}`}
                >
                  {cineforum.name}
                </h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 shrink-0" />
              </div>

              <p
                className={`text-muted-foreground ${viewMode === "list" ? "text-sm line-clamp-1" : "text-sm line-clamp-2 mb-4"}`}
              >
                {cineforum.description || t("home.noDescription")}
              </p>
            </div>
          </div>

          {/* Stats & Actions */}
          <div
            className={`flex items-center gap-2 ${viewMode === "list" ? "" : "mt-auto"}`}
          >
            <Badge
              variant="secondary"
              className="gap-1 bg-secondary/50 text-muted-foreground text-xs"
            >
              <Users className="h-3 w-3" />
              {cineforum._count?.memberships ?? 0}
            </Badge>

            <Badge
              variant="secondary"
              className="gap-1 bg-secondary/50 text-muted-foreground text-xs"
            >
              <Popcorn className="h-3 w-3" />
              {cineforum._count?.rounds ?? 0}
            </Badge>

            {/* Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 ml-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  aria-label={t("home.actionsAriaLabel")}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-border/50 bg-card"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem
                  onClick={() => onCopyLink(cineforum.id)}
                  className="gap-2 cursor-pointer"
                >
                  {copiedId === cineforum.id ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">
                        {t("home.linkCopied")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("home.copyLink")}
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/50" />

                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href={`/cineforum/${cineforum.id}`}>
                    <CalendarClock className="h-4 w-4" />
                    {t("home.goToCineforum")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Link>
  );
}
