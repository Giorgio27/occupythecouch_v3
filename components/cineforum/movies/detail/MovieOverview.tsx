import { useState } from "react";
import { useTranslation } from "react-i18next";

type MovieOverviewProps = { text: string };

/** Plots longer than this are clamped on phones, where they would push everything else down. */
const CLAMP_FROM_CHARS = 280;

/** The plot, clamped to four lines on phones with a toggle; always full from `sm` up. */
export default function MovieOverview({
  text,
}: MovieOverviewProps): JSX.Element {
  const { t } = useTranslation("movie");
  const [expanded, setExpanded] = useState(false);
  const clampable = text.length > CLAMP_FROM_CHARS;
  const clampClass =
    clampable && !expanded ? "line-clamp-4 sm:line-clamp-none" : "";

  return (
    <div>
      <p
        className={`text-sm leading-relaxed text-muted-foreground ${clampClass}`}
      >
        {text}
      </p>
      {clampable && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 text-xs font-medium text-primary sm:hidden"
        >
          {expanded ? t("hero.showLess") : t("hero.showMore")}
        </button>
      )}
    </div>
  );
}
