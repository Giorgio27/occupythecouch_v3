import { useState, useMemo } from "react";
import { Calendar, Sofa } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OscarsRoundDTO } from "@/lib/shared/types/cineforum";
import { ExpandableListItem } from "@/components/cineforum/common";
import { useTranslation } from "react-i18next";
import OscarsPreviewMovieRow from "./OscarsPreviewMovieRow";

interface OscarsPreviewRoundCardProps {
  round: OscarsRoundDTO;
}

/**
 * Renders the single open oscarable round in the admin preview.
 *
 * Copies the closed-round oscars card layout but reflects the live, partial
 * status: an "open" badge and the current average across the movies voted so far.
 */
export default function OscarsPreviewRoundCard({
  round,
}: OscarsPreviewRoundCardProps) {
  const { t } = useTranslation("admin");
  const [isExpanded, setIsExpanded] = useState(true);

  const partialAverage = useMemo(() => {
    const rated = round.winners.filter((w) => w.roundRating !== null);
    if (rated.length === 0) return null;
    const total = rated.reduce((sum, w) => sum + (w.roundRating || 0), 0);
    return Math.round((total / rated.length) * 100) / 100;
  }, [round.winners]);

  // Movie(s) currently in the lead — highest partial average (ties included).
  const leadingIds = useMemo(() => {
    const rated = round.winners.filter((w) => w.roundRating !== null);
    if (rated.length === 0) return new Set<string>();
    const best = Math.max(...rated.map((w) => w.roundRating as number));
    return new Set(
      rated.filter((w) => w.roundRating === best).map((w) => w.id),
    );
  }, [round.winners]);

  const titleNode = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-primary leading-tight">
          {round.name}
        </span>
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-500"
        >
          {t("oscars.openBadge")}
        </Badge>
      </div>
      {round.date && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{round.date}</span>
        </div>
      )}
    </div>
  );

  return (
    <ExpandableListItem
      title={titleNode}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((v) => !v)}
    >
      <div className="space-y-2">
        {round.winners.map((movie) => (
          <OscarsPreviewMovieRow
            key={movie.id}
            movie={movie}
            isLeading={leadingIds.has(movie.id)}
          />
        ))}
      </div>

      {round.winners.length > 0 && (
        <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground">
          <span>{t("oscars.partialAverage")}</span>
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <Sofa className="h-3 w-3 text-primary" />
            <span>{partialAverage !== null ? partialAverage : "—"}</span>
          </div>
        </div>
      )}
    </ExpandableListItem>
  );
}
