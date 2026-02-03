import * as React from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Crown, Sofa } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MovieWinner {
  id: string;
  title: string;
  year: number | null;
  actors: string;
  image: string | null;
  imageMedium: string | null;
  poster: string | null;
  overview: string | null;
  roundRating: number | null;
  userRating: number | null;
  proposer: string;
  roundVotes: Array<{
    user: string;
    userName: string | null;
    rating: number;
  }>;
}

interface RoundBest {
  id: string;
  title: string;
  proposer: string;
  roundRating: number | null;
}

interface OscarsRound {
  id: string;
  name: string;
  closed: boolean;
  date: string | null;
  createdAt: string;
  chooser: {
    id: string;
    name: string | null;
  } | null;
  winners: MovieWinner[];
  bests: RoundBest[];
}

interface OscarsRoundCardProps {
  round: OscarsRound;
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
                {/* <div className="flex-shrink-0 w-24 h-36 relative bg-muted rounded overflow-hidden">
                  {(movie.imageMedium || movie.image || movie.poster) && (
                    <Image
                      src={
                        movie.imageMedium || movie.image || movie.poster || ""
                      }
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div> */}

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
                  {/* Star Rating */}
                  <div className="flex items-center justify-end">
                    <StarRating
                      value={movie.userRating || 0}
                      onChange={(rating) => handleVote(movie.id, rating)}
                      readOnly={round.closed}
                      disabled={votingMovie === movie.id}
                    />
                  </div>

                  {/* Average Rating (if closed) */}
                  {round.closed && movie.roundRating !== null && (
                    <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                      <span>media</span>
                      <Sofa className="h-4 w-4" />
                      <span>{movie.roundRating}</span>
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

// Star Rating Component
interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  disabled?: boolean;
}

function StarRating({ value, onChange, readOnly, disabled }: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const handleClick = (starValue: number) => {
    if (readOnly || disabled) return;
    onChange(starValue);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayValue >= star;
        const halfFilled = displayValue >= star - 0.5 && displayValue < star;

        return (
          <div
            key={star}
            className={`relative w-5 h-5 ${
              readOnly || disabled ? "cursor-default" : "cursor-pointer"
            }`}
            onMouseEnter={() => !readOnly && !disabled && setHoverValue(star)}
            onMouseLeave={() => !readOnly && !disabled && setHoverValue(null)}
            onClick={() => handleClick(star)}
          >
            {/* Background star */}
            <svg
              className="absolute inset-0 text-gray-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {/* Filled star */}
            {(filled || halfFilled) && (
              <svg
                className="absolute inset-0 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                style={{
                  clipPath: halfFilled ? "inset(0 50% 0 0)" : undefined,
                }}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
