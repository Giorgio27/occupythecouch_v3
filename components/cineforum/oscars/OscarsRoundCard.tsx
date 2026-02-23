import { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Crown, Sofa, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CouchRating } from "@/components/ui/couch-rating";
import {
  MovieWinnerDTO,
  RoundBestDTO,
  OscarsRoundDTO,
} from "@/lib/shared/types/cineforum";

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
  const [isExpanded, setIsExpanded] = useState(isFirst);
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
    <Card className="overflow-hidden border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
      <CardHeader
        className="cursor-pointer hover:bg-accent/30 transition-all duration-300 group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-primary group-hover:text-primary/80 transition-colors mb-1.5">
                {round.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{round.date}</span>
                {round.closed && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Chiuso
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 p-2 rounded-lg bg-accent/50 group-hover:bg-accent transition-colors">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Collapsed Preview */}
          {!isExpanded && round.bests.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              {/* Winners */}
              <div className="flex flex-wrap items-center gap-2">
                {round.bests.map((best) => (
                  <div
                    key={best.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20"
                  >
                    <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{best.title}</span>
                    <span className="text-xs text-muted-foreground">
                      ({best.proposer})
                    </span>
                  </div>
                ))}
              </div>

              {/* Average Rating */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Media ciclo:</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Sofa className="h-4 w-4 text-primary" />
                  <span>{roundAverageRating}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-6">
          <div className="space-y-3">
            {round.winners.map((movie, index) => {
              const isWinner =
                round.closed && round.bests.some((b) => b.id === movie.id);

              return (
                <div
                  key={movie.id}
                  className="group relative flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-xl hover:border-primary/30 hover:bg-accent/20 transition-all duration-300 hover:shadow-md"
                >
                  {/* Winner Badge - Only shown when round is closed */}
                  {isWinner && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="p-1.5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Movie Image */}
                  <div className="flex-shrink-0 w-full sm:w-24 h-48 sm:h-36 relative bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden shadow-sm">
                    {movie.imageMedium || movie.image || movie.poster ? (
                      <img
                        src={
                          movie.imageMedium || movie.image || movie.poster || ""
                        }
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sofa className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="font-bold text-base sm:text-lg leading-tight">
                        {movie.title}
                        {movie.year && (
                          <span className="text-muted-foreground font-normal ml-2">
                            ({movie.year})
                          </span>
                        )}
                      </h4>
                      {movie.actors && (
                        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                          {movie.actors}
                        </p>
                      )}
                    </div>

                    {/* Proposer */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Proposto da:</span>
                      <span className="font-medium text-foreground">
                        {movie.proposer}
                      </span>
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="flex-shrink-0 w-full sm:w-48 space-y-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    {/* Couch Rating */}
                    <div className="flex items-center justify-center sm:justify-end">
                      <CouchRating
                        value={movie.userRating || 0}
                        onChange={(rating) => handleVote(movie.id, rating)}
                        readOnly={round.closed}
                        disabled={votingMovie === movie.id}
                      />
                    </div>

                    {/* User Rating Display */}
                    {movie.userRating !== null && movie.userRating > 0 && (
                      <div className="flex items-center justify-center sm:justify-end gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          Il tuo voto:
                        </span>
                        <span className="font-bold text-base text-primary">
                          {movie.userRating.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Average Rating (if closed) */}
                    {round.closed && movie.roundRating !== null && (
                      <div className="flex items-center justify-center sm:justify-end gap-1.5 px-3 py-1.5 rounded-lg bg-accent/50">
                        <span className="text-xs text-muted-foreground">
                          Media:
                        </span>
                        <Sofa className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">
                          {movie.roundRating.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
