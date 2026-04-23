"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clapperboard,
  Copy,
  MoreHorizontal,
  Users,
  Popcorn,
} from "lucide-react";
import { CineforumDTO } from "@/lib/shared/types";

type ViewMode = "grid" | "list";

type CineforumCardProps = {
  cineforum: CineforumDTO;
  index: number;
  isInView: boolean;
  viewMode: ViewMode;
  copiedId: string | null;
  onCopyLink: (id: string) => void;
};

export default function CineforumCard({
  cineforum,
  index,
  isInView,
  viewMode,
  copiedId,
  onCopyLink,
}: CineforumCardProps) {
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
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-60" />

        <div
          className={`relative ${viewMode === "list" ? "flex items-center justify-between gap-4" : ""}`}
        >
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
