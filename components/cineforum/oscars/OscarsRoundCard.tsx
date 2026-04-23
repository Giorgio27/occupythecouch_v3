import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Crown, Sofa, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OscarsRoundDTO } from "@/lib/shared/types/cineforum";
import OscarsMovieRow from "./OscarsMovieRow";

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

  return (
    <Card className="overflow-hidden border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md py-1">
      <CardHeader
        className={`py-3 px-4 ${round.closed ? "cursor-pointer hover:bg-accent/20 transition-colors" : ""}`}
        onClick={() => round.closed && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-primary leading-tight">
                {round.name}
              </h3>
              {round.closed && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Chiuso
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{round.date}</span>
            </div>
          </div>

          {round.closed && !isExpanded && round.bests.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {round.bests.map((best) => (
                <div
                  key={best.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-xs"
                >
                  <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[120px]">
                    {best.title}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sofa className="h-3 w-3 text-primary" />
                <span className="font-semibold">{roundAverageRating}</span>
              </div>
            </div>
          )}

          {round.closed && (
            <div className="flex-shrink-0 p-1.5 rounded-md bg-accent/40">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-3">
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
            <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Media ciclo</span>
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <Sofa className="h-3 w-3 text-primary" />
                <span>{roundAverageRating}</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
