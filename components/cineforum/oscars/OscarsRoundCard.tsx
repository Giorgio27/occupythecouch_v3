import { useState, useMemo } from "react";
import { Crown, Sofa, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OscarsRoundDTO } from "@/lib/shared/types/cineforum";
import OscarsMovieRow from "./OscarsMovieRow";
import { useTranslation } from "react-i18next";
import { ExpandableListItem } from "@/components/cineforum/common";

interface OscarsRoundCardProps {
  round: OscarsRoundDTO;
  isFirst: boolean;
  onVote: (roundId: string, movieId: string, rating: number) => Promise<void>;
}

export default function OscarsRoundCard({
  round,
  isFirst,
  onVote,
}: OscarsRoundCardProps) {
  const { t } = useTranslation("oscars");
  const [isExpanded, setIsExpanded] = useState(!round.closed || isFirst);
  const [votingMovie, setVotingMovie] = useState<string | null>(null);

  const roundAverageRating = useMemo(() => {
    if (round.winners.length === 0) return 0;
    const total = round.winners.reduce(
      (sum, w) => sum + (w.roundRating || 0),
      0,
    );
    return Math.round((total / round.winners.length) * 100) / 100;
  }, [round.winners]);

  const handleVote = async (movieId: string, rating: number) => {
    if (round.closed) return;
    setVotingMovie(movieId);
    try {
      await onVote(round.id, movieId, rating);
    } finally {
      setVotingMovie(null);
    }
  };

  // Custom title node: round name + closed badge + date
  const titleNode = (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-primary leading-tight">
          {round.name}
        </span>
        {round.closed && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {t("closed")}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{round.date}</span>
      </div>
    </div>
  );

  // Metric node: best winners summary (shown when collapsed)
  const metricNode =
    round.closed && !isExpanded && round.bests.length > 0 ? (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {round.bests.map((best) => (
          <div
            key={best.id}
            className="flex items-center gap-1 rounded-md border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-xs"
          >
            <Crown className="h-3 w-3 shrink-0 text-yellow-500" />
            <span className="max-w-30 truncate font-medium">{best.title}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sofa className="h-3 w-3 text-primary" />
          <span className="font-semibold">{roundAverageRating}</span>
        </div>
      </div>
    ) : undefined;

  return (
    <ExpandableListItem
      title={titleNode}
      metric={metricNode}
      isExpanded={isExpanded}
      onToggle={() => round.closed && setIsExpanded((v) => !v)}
    >
      <div className="space-y-2">
        {round.winners.map((movie) => (
          <OscarsMovieRow
            key={movie.id}
            movie={movie}
            isWinner={
              round.closed && round.bests.some((b) => b.id === movie.id)
            }
            isClosed={round.closed}
            votingMovieId={votingMovie}
            onVote={handleVote}
          />
        ))}
      </div>

      {round.closed && round.winners.length > 0 && (
        <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground">
          <span>{t("averageCycle")}</span>
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <Sofa className="h-3 w-3 text-primary" />
            <span>{roundAverageRating}</span>
          </div>
        </div>
      )}
    </ExpandableListItem>
  );
}
