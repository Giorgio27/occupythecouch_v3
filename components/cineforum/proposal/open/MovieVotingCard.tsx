import * as React from "react";
import { GripVertical, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      className={[
        "group relative rounded-lg border transition-all duration-200",
        isDragging
          ? "opacity-40 scale-95 cursor-grabbing"
          : "cursor-grab active:cursor-grabbing hover:shadow-lg",
        isInUnranked
          ? "bg-muted/40 border-border/50 hover:border-primary/40"
          : "bg-card border-primary/30 hover:border-primary/60",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 group-hover:opacity-100" />

      <div className="relative flex items-center gap-3 p-3">
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
              className="h-16 w-11 rounded border border-border/60 object-cover shadow-sm"
            />
          ) : (
            <div className="h-16 w-11 rounded border border-border/60 bg-muted/50 flex items-center justify-center">
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
        </div>

        {/* Current Position Badge */}
        {currentPosition !== null && !isInUnranked && (
          <div className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 border border-primary/30">
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
    </div>
  );
}
