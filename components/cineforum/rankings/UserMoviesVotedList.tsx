import { useTranslation } from "react-i18next";
import { Trophy, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/cineforum/common/EmptyState";
import type { MovieRoundRankingDTO } from "@/lib/shared/types";

type Props = { movieRoundRankings: MovieRoundRankingDTO[] };

/** List of a user's rated proposals, with their club average and round. */
export default function UserMoviesVotedList({ movieRoundRankings }: Props) {
  const { t } = useTranslation("rankings");

  return (
    <div>
      <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
        <Film className="w-4 h-4" />
        {t("users.moviesVoted")}
      </h3>

      {movieRoundRankings.length === 0 ? (
        <EmptyState
          title={t("users.noMoviesVoted")}
          subtitle={t("users.noMoviesVotedSubtitle")}
        />
      ) : (
        <div className="space-y-2">
          {movieRoundRankings.map((mrr, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium text-foreground truncate">
                  {mrr.movie}
                </span>
                {mrr.round_winner && (
                  <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                )}
              </div>
              <div className="text-sm flex items-center gap-3 shrink-0 ml-4">
                <span className="font-bold text-gradient tabular-nums">
                  {mrr.average_rating?.toFixed(2) ?? "N/A"}
                </span>
                <Badge variant="outline" className="text-xs">
                  {mrr.round}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
