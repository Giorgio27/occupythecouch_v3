"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CineforumDTO } from "@/lib/shared/types";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BookOpen,
  Check,
  Clapperboard,
  LayoutGrid,
  LayoutList,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateCineforumDialog from "./CreateCineforumDialog";
import CineforumCard from "./CineforumCard";
import CineforumEmptyState from "./CineforumEmptyState";

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
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

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
  const heroSection = useInView(0.1);
  const cardsSection = useInView(0.1);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [justCreated, setJustCreated] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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

  function handleCreated() {
    setJustCreated(true);
    setTimeout(() => setJustCreated(false), 1600);
  }

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
              <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in-down">
                <div className="cine-badge animate-shine group cursor-default text-xs sm:text-sm">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 group-hover:animate-spin-slow" />
                  <span>{t("home.badge")}</span>
                </div>
              </div>

              <div className="text-center space-y-4 sm:space-y-6">
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

                <Link
                  href="/tutorial"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200 group"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-200">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-left">
                      {t("home.tutorialLink")}
                    </p>
                  </div>
                </Link>
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
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("home.searchPlaceholder")}
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3">
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

                  <CreateCineforumDialog
                    onCreated={handleCreated}
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
              <div
                className={`transition-all duration-700 delay-100 ${cardsSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <CineforumEmptyState
                  total={total}
                  onClearSearch={() => setQuery("")}
                  onOpenCreate={() => setCreateOpen(true)}
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
