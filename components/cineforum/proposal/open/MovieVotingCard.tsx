import * as React from "react";
import { GripVertical, Star, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface MovieVotingCardProps {
  movie: any;
  currentPosition: number | null;
  totalPositions: number;
  onPositionChange: (position: number | null) => void;
  isDragging?: boolean;
  isInUnranked?: boolean;
}

/**
 * Draggable movie card for voting interface
 * Can be dragged between position slots or moved via quick action buttons
 */
export default function MovieVotingCard({
  movie,
  currentPosition,
  totalPositions,
  onPositionChange,
  isDragging = false,
  isInUnranked = false,
}: MovieVotingCardProps) {
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  const [showPositionPicker, setShowPositionPicker] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        movieId: movie.id,
        currentPosition,
      }),
    );
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
      onClick={() => {
        if (!isInUnranked) {
          setShowPositionPicker((prev) => !prev);
        }
      }}
      className={[
        "group relative rounded-lg border transition-all duration-200",
        isInUnranked
          ? "bg-card/80 border-border/60 hover:border-primary/50 hover:bg-card"
          : "bg-card border-primary/30 hover:border-primary/60",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 group-hover:opacity-100" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3">
        {/* Main content row */}
        <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0">
          {/* Drag Handle */}
          <div className="shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Movie Poster */}
          <div className="shrink-0">
            {movie.imageMedium || movie.image || movie.poster ? (
              <img
                alt={movie.title}
                src={movie.imageMedium || movie.image || movie.poster}
                className="h-20 w-14 rounded border border-border/60 object-cover shadow-sm"
              />
            ) : (
              <div className="h-20 w-14 rounded border border-border/60 bg-muted/50 flex items-center justify-center">
                <Star className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Movie Info */}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm leading-tight line-clamp-2">
              {movie.title}
              {movie.year && (
                <span className="ml-1.5 text-muted-foreground font-normal">
                  ({movie.year})
                </span>
              )}
            </div>
            {movie.director && (
              <div className="mt-1 text-xs text-muted-foreground truncate">
                {movie.director}
              </div>
            )}

            {/* Movie metadata row */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {movie.runtime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                  <Clock className="h-3 w-3" />
                  <span>{movie.runtime}</span>
                </div>
              )}
              {movie.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${movie.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  title="View on IMDb"
                >
                  <Image
                    src="/imdb-icon.webp"
                    alt="IMDb"
                    width={16}
                    height={16}
                    className="rounded-sm"
                  />
                </a>
              )}
              {(movie.rating || movie.imdbRating) && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-muted-foreground font-medium">
                    {movie.rating || movie.imdbRating}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side: badges and actions */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0 self-end sm:self-center">
          {/* Current Position Badge */}
          {currentPosition !== null && !isInUnranked && (
            <div
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 border border-primary/30 cursor-pointer hover:bg-primary/30 transition-colors"
              title="Click to move to another position"
            >
              <Star className="h-3.5 w-3.5 fill-primary/30 text-primary" />
              <span className="text-xs font-bold text-primary">
                {currentPosition}°
              </span>
            </div>
          )}

          {/* Remove from position button (only when positioned) */}
          {currentPosition !== null && !isInUnranked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPositionChange(null);
              }}
              className="shrink-0 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
              title="Remove from ranking"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Action Buttons - Show on hover when in unranked area */}
      {isInUnranked && showQuickActions && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-1 shadow-lg animate-fade-in z-10">
          {Array.from(
            { length: Math.min(totalPositions, 5) },
            (_, i) => i + 1,
          ).map((pos) => (
            <Button
              key={pos}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPositionChange(pos);
              }}
              className="h-7 w-7 p-0 rounded-full text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all"
              title={`Assign to position ${pos}`}
            >
              {pos}
            </Button>
          ))}
          {totalPositions > 5 && (
            <span className="text-xs text-muted-foreground px-1">...</span>
          )}
        </div>
      )}

      {/* Position Picker - Show on click when in ranked slot */}
      {!isInUnranked && showPositionPicker && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-1 shadow-lg animate-fade-in z-10">
          {Array.from(
            { length: Math.min(totalPositions, 5) },
            (_, i) => i + 1,
          ).map((pos) => (
            <Button
              key={pos}
              variant={pos === currentPosition ? "default" : "ghost"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPositionChange(pos);
                setShowPositionPicker(false);
              }}
              className={[
                "h-7 w-7 p-0 rounded-full text-xs font-bold transition-all",
                pos === currentPosition
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-primary hover:text-primary-foreground",
              ].join(" ")}
              title={`Move to position ${pos}`}
            >
              {pos}
            </Button>
          ))}
          {totalPositions > 5 && (
            <span className="text-xs text-muted-foreground px-1">...</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowPositionPicker(false);
            }}
            className="h-7 w-7 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive transition-all"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
