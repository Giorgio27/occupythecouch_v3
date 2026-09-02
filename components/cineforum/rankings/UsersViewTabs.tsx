import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, Trophy } from "lucide-react";

export type UsersViewMode = "cards" | "table" | "positions";

type Props = {
  viewMode: UsersViewMode;
  onViewModeChange: (mode: UsersViewMode) => void;
};

/** Top-level view switcher for the users ranking page: Griglia / Tabella / Posizioni. */
export default function UsersViewTabs({ viewMode, onViewModeChange }: Props) {
  const { t } = useTranslation("rankings");

  const iconClassName = "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0";
  const tabs: { value: UsersViewMode; icon: ReactNode; label: string }[] = [
    {
      value: "cards",
      icon: <LayoutGrid className={iconClassName} />,
      label: t("users.viewCards"),
    },
    {
      value: "table",
      icon: <List className={iconClassName} />,
      label: t("users.viewTable"),
    },
    {
      value: "positions",
      icon: <Trophy className={iconClassName} />,
      label: t("users.viewPositions"),
    },
  ];

  return (
    <div
      className="mb-4 flex gap-1 rounded-xl border border-border bg-card p-1 animate-fade-in-up"
      style={{ animationDelay: "150ms" }}
    >
      {tabs.map((tab) => {
        const active = viewMode === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onViewModeChange(tab.value)}
            className={`flex flex-1 items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 sm:px-4 sm:py-2.5 sm:text-sm ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
