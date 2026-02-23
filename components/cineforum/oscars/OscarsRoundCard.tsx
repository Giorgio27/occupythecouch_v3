import * as React from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Crown, Sofa } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [isExpanded, setIsExpanded] = React.useState(isFirst);
  const [votingMovie, setVotingMovie] = React.useState<string | null>(null);

  const roundAverageRating = React.useMemo(() => {
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
    <Card className="mb-4">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-red-600">{round.name}</h3>
            <span className="text-sm text-muted-foreground">{round.date}</span>
          </div>

          {!isExpanded && round.bests.length > 0 && (
            <>
              <div className="flex items-center justify-end gap-2 text-sm">
                {round.bests.map((best) => (
                  <div key={best.id} className="flex items-center gap-1">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span>
                      {best.title} ({best.proposer})
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">media ciclo:</span>
                <div className="flex items-center gap-1">
                  <Sofa className="h-4 w-4" />
                  <span>{roundAverageRating}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-center">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          <div className="space-y-4">
            {round.winners.map((movie) => (
              <div
                key={movie.id}
                className="flex gap-4 p-4 border rounded-lg hover:bg-accent/20 transition-colors"
              >
                {/* Movie Image */}
                <div className="flex-shrink-0 w-24 h-36 relative bg-muted rounded overflow-hidden">
                  {(movie.imageMedium || movie.image || movie.poster) && (
                    <img
                      src={
                        movie.imageMedium || movie.image || movie.poster || ""
                      }
                      alt={movie.title}
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div>

                {/* Movie Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base">
                    {movie.title} {movie.year && `(${movie.year})`}
                  </h4>
                  {movie.actors && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {movie.actors}
                    </p>
                  )}
                </div>

                {/* Rating Section */}
                <div className="flex-shrink-0 w-48 space-y-2">
                  {/* Couch Rating */}
                  <div className="flex items-center justify-end">
                    <CouchRating
                      value={movie.userRating || 0}
                      onChange={(rating) => handleVote(movie.id, rating)}
                      readOnly={round.closed}
                      disabled={votingMovie === movie.id}
                    />
                  </div>

                  {/* User Rating Display */}
                  {movie.userRating !== null && movie.userRating > 0 && (
                    <div className="flex items-center justify-end gap-1 text-sm">
                      <span className="font-medium">
                        {movie.userRating.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Average Rating (if closed) */}
                  {round.closed && movie.roundRating !== null && (
                    <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                      <span>media</span>
                      <Sofa className="h-4 w-4" />
                      <span>{movie.roundRating.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Proposer */}
                  <div className="text-sm text-muted-foreground text-right">
                    di: {movie.proposer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
