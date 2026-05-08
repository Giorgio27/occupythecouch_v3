import { useState } from "react";
import { ChevronDown, ChevronUp, Crown, Sofa } from "lucide-react";
import { CouchRating } from "@/components/ui/couch-rating";
import { MovieWinnerDTO } from "@/lib/shared/types/cineforum";
import UserVotes from "./UserVotes";
import ExternalRatings from "./ExternalRatings";
import MoviePoster from "@/components/ui/MoviePoster";

interface OscarsMovieRowProps {
  movie: MovieWinnerDTO;
  isWinner: boolean;
  isClosed: boolean;
  votingMovieId: string | null;
  onVote: (movieId: string, rating: number) => void;
}

export default function OscarsMovieRow({
  movie,
  isWinner,
  isClosed,
  votingMovieId,
  onVote,
}: OscarsMovieRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`oscars-movie-card${isWinner ? " oscars-movie-card--winner" : ""}${isClosed ? " cursor-pointer" : ""}`}
      onClick={() => isClosed && setIsExpanded((prev) => !prev)}
    >
      {isWinner && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <div className="p-1 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md">
            <Crown className="h-3 w-3 text-white" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <div className="oscars-movie-card__poster overflow-hidden">
          <MoviePoster
            imageMedium={movie.imageMedium}
            poster={movie.poster}
            image={movie.image}
            imdbId={movie.id}
            alt={movie.title}
            className="w-full h-full object-cover"
            placeholderClassName="w-full h-full flex items-center justify-center bg-muted"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight truncate">
            {movie.title}
            {movie.year && (
              <span className="text-muted-foreground font-normal ml-1">
                ({movie.year})
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {movie.proposer}
          </p>
        </div>

        <div
          className="shrink-0 flex flex-col items-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {isClosed ? (
            <>
              {movie.roundRating !== null && (
                <div className="flex items-center gap-1 text-xs font-semibold">
                  <Sofa className="h-3 w-3 text-primary" />
                  <span>{movie.roundRating.toFixed(2)}</span>
                </div>
              )}
              <span className="text-[10px] text-muted-foreground">
                {isExpanded ? (
                  <span className="flex items-center gap-0.5">
                    meno <ChevronUp className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5">
                    dettagli <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <CouchRating
                value={movie.userRating || 0}
                onChange={(rating) => onVote(movie.id, rating)}
                readOnly={false}
                disabled={votingMovieId === movie.id}
              />
              {movie.userRating !== null && movie.userRating > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Il tuo voto:{" "}
                  <span className="font-bold text-primary">
                    {movie.userRating.toFixed(2)}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {isClosed && isExpanded && (
        <div
          className="mt-2 pt-2 border-t border-border/50 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <UserVotes votes={movie.roundVotes} />
          <ExternalRatings movie={movie} />
        </div>
      )}
    </div>
  );
}
