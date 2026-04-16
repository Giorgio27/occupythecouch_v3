import * as React from "react";
import { useTranslation } from "react-i18next";
import { Trophy, Plus, Medal } from "lucide-react";
import MovieVotingCard from "./MovieVotingCard";

interface RankingSlotProps {
  position: number;
  movies: any[];
  totalPositions: number;
  onMoviePositionChange: (movieId: string, newPosition: number | null) => void;
  onDrop: (position: number, movieId: string) => void;
  draggingMovieId: string | null;
}

/**
 * A slot container for a specific ranking position
 * Supports multiple movies (pari merito) and drag & drop
 */
export default function RankingSlot({
  position,
  movies,
  totalPositions,
  onMoviePositionChange,
  onDrop,
  draggingMovieId,
}: RankingSlotProps) {
  const { t } = useTranslation("proposal");
  const [isDragOver, setIsDragOver] = React.useState(false);
  const isEmpty = movies.length === 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set to false if we're actually leaving the slot
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const movieId = data.movieId;

      if (movieId) {
        onDrop(position, movieId);
      }
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  // Medal colors for top 3 positions
  const getMedalColor = () => {
    switch (position) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-amber-700";
      default:
        return "text-primary";
    }
  };

  const getPositionIcon = () => {
    if (position <= 3) {
      return <Medal className={`h-5 w-5 ${getMedalColor()}`} />;
    }
    return <Trophy className="h-5 w-5 text-primary/60" />;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        "relative rounded-xl border-2 transition-all duration-300",
        isDragOver && draggingMovieId
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]"
          : isEmpty
            ? "border-dashed border-border/40 bg-muted/20"
            : "border-border/60 bg-card/40",
        "min-h-[120px]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Position Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          {getPositionIcon()}
          <div>
            <div className="text-sm font-bold text-foreground">
              {position}° {t("open.position")}
            </div>
            {movies.length > 1 && (
              <div className="text-xs text-muted-foreground">
                {t("open.filmsTied", { count: movies.length })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Movies Container */}
      <div className="p-3 space-y-2">
        {isEmpty ? (
          <div
            className={[
              "flex flex-col items-center justify-center py-8 rounded-lg transition-all duration-300",
              isDragOver && draggingMovieId
                ? "bg-primary/5 border-2 border-dashed border-primary"
                : "border-2 border-dashed border-border/20",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Plus className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground/60 font-medium">
              {t("open.dragFilmHere")}
            </p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              {t("open.orUseQuickActions")}
            </p>
          </div>
        ) : (
          <>
            {movies.map((movie) => (
              <MovieVotingCard
                key={movie.id}
                movie={movie}
                currentPosition={position}
                totalPositions={totalPositions}
                onPositionChange={(newPos) =>
                  onMoviePositionChange(movie.id, newPos)
                }
                isDragging={draggingMovieId === movie.id}
                isInUnranked={false}
              />
            ))}

            {/* Drop zone indicator when dragging over non-empty slot */}
            {isDragOver && draggingMovieId && (
              <div className="flex items-center justify-center py-3 rounded-lg border-2 border-dashed border-primary bg-primary/5 animate-pulse">
                <Plus className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">
                  {t("open.addAsTied")}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drag over overlay */}
      {isDragOver && draggingMovieId && (
        <div className="absolute inset-0 rounded-xl bg-primary/5 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
