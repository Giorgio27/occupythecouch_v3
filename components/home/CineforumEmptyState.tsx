"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Clapperboard, Plus, Users, Vote } from "lucide-react";

type CineforumEmptyStateProps = {
  total: number;
  onClearSearch: () => void;
  onOpenCreate: () => void;
};

export default function CineforumEmptyState({
  total,
  onClearSearch,
  onOpenCreate,
}: CineforumEmptyStateProps) {
  const { t } = useTranslation("cineforum");

  const hints = [
    { icon: Plus, title: t("empty.hint1Title"), desc: t("empty.hint1Desc") },
    { icon: Users, title: t("empty.hint2Title"), desc: t("empty.hint2Desc") },
    { icon: Vote, title: t("empty.hint3Title"), desc: t("empty.hint3Desc") },
  ];

  return (
    <div className="cine-card text-center py-12 sm:py-16 md:py-20 relative overflow-hidden">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          {hints.map((hint, idx) => {
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
