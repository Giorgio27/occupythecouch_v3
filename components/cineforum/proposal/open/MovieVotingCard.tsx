import * as React from "react";
import { GripVertical, Star, X, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useTouchDrag } from "./useTouchDrag";
import PositionPicker from "./PositionPicker";
import MoviePoster from "@/components/ui/MoviePoster";
import type { ProposalMovieDTO } from "@/lib/shared/types";

interface MovieVotingCardProps {
  movie: ProposalMovieDTO;
  currentPosition: number | null;
  totalPositions: number;
  onPositionChange: (position: number | null) => void;
  isDragging?: boolean;
  isInUnranked?: boolean;
  onTouchDrop?: (movieId: string, position: number) => void;
  onTouchDragPositionChange?: (position: number | null) => void;
}

export default function MovieVotingCard({
  movie,
  currentPosition,
  totalPositions,
  onPositionChange,
  isDragging = false,
  isInUnranked = false,
  onTouchDrop,
  onTouchDragPositionChange,
}: MovieVotingCardProps) {
  const { t } = useTranslation("proposal");
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  const [showPositionPicker, setShowPositionPicker] = React.useState(false);

  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    setIsTouchDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { cardRef, isTouchPressing } = useTouchDrag({
    movieId: movie.id,
    onTouchDrop,
    onTouchDragPositionChange,
  });

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ movieId: movie.id, currentPosition }),
    );
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => !isTouchDevice && setShowQuickActions(true)}
      onMouseLeave={() => !isTouchDevice && setShowQuickActions(false)}
      onClick={() => {
        if (isInUnranked) {
          if (isTouchDevice) setShowQuickActions((prev) => !prev);
        } else {
          setShowPositionPicker((prev) => !prev);
        }
      }}
      className={[
        "group relative rounded-lg border transition-all duration-200",
        isInUnranked
          ? "bg-card/80 border-border/60 hover:border-primary/50 hover:bg-card"
          : "bg-card border-primary/30 hover:border-primary/60",
        !isInUnranked ? "cursor-pointer" : "",
        isTouchPressing
          ? "scale-[1.02] border-primary/70 shadow-md shadow-primary/20"
          : "",
        isTouchDevice ? "touch-none" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 group-hover:opacity-100" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3">
        <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0">
          <div className="shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary">
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="shrink-0">
            <MoviePoster
              imageMedium={movie.imageMedium ?? null}
              poster={movie.poster ?? null}
              image={movie.image ?? null}
              imdbId={movie.imdbId ?? null}
              alt={movie.title ?? ""}
              className="h-20 w-14 rounded border border-border/60 object-cover shadow-sm"
              placeholderClassName="h-20 w-14 rounded border border-border/60 bg-muted/50 flex items-center justify-center"
            />
          </div>

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

        <div className="flex items-center gap-2 ml-auto sm:ml-0 self-end sm:self-center">
          {currentPosition !== null && !isInUnranked && (
            <div
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 border border-primary/30 cursor-pointer hover:bg-primary/30 transition-colors"
              title={t("open.tapToReorder")}
            >
              <Star className="h-3.5 w-3.5 fill-primary/30 text-primary" />
              <span className="text-xs font-bold text-primary">
                {currentPosition}°
              </span>
              <ChevronDown className="h-3 w-3 text-primary/70" />
            </div>
          )}

          {currentPosition !== null && !isInUnranked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPositionChange(null);
              }}
              className={[
                "shrink-0 h-7 w-7 p-0 transition-opacity hover:bg-destructive/20 hover:text-destructive",
                isTouchDevice
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              ].join(" ")}
              title="Remove from ranking"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isInUnranked && isTouchDevice && !showQuickActions && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 pointer-events-none">
          <span className="text-[10px] font-medium text-primary leading-none">
            {t("open.tapToRank")}
          </span>
        </div>
      )}

      {isInUnranked && showQuickActions && (
        <PositionPicker
          totalPositions={totalPositions}
          showClose={isTouchDevice}
          onSelect={(pos) => {
            onPositionChange(pos);
            if (isTouchDevice) setShowQuickActions(false);
          }}
          onClose={() => setShowQuickActions(false)}
        />
      )}

      {!isInUnranked && showPositionPicker && (
        <PositionPicker
          totalPositions={totalPositions}
          currentPosition={currentPosition}
          showClose={true}
          onSelect={(pos) => {
            onPositionChange(pos);
            setShowPositionPicker(false);
          }}
          onClose={() => setShowPositionPicker(false)}
        />
      )}
    </div>
  );
}
