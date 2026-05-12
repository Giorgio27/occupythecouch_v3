import { useTranslation } from "react-i18next";
import { CheckCircle2, Inbox } from "lucide-react";
import MovieVotingCard from "./MovieVotingCard";
import type { ProposalMovieDTO } from "@/lib/shared/types";

type UnrankedPanelProps = {
  movies: ProposalMovieDTO[];
  totalPositions: number;
  draggingMovieId: string | null;
  onDragStart: (movieId: string) => void;
  onDragEnd: () => void;
  onPositionChange: (movieId: string, pos: number | null) => void;
  onTouchDrop: (movieId: string, position: number) => void;
  onTouchDragPositionChange: (position: number | null) => void;
};

export default function UnrankedPanel({
  movies,
  totalPositions,
  draggingMovieId,
  onDragStart,
  onDragEnd,
  onPositionChange,
  onTouchDrop,
  onTouchDragPositionChange,
}: UnrankedPanelProps) {
  const { t } = useTranslation("proposal");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 sticky top-4">
        <Inbox className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-bold text-foreground">
          {t("open.unrankedMovies")}
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {movies.length}
        </span>
      </div>

      <div className="space-y-2 sticky top-16">
        {movies.length === 0 ? (
          <div className="cine-card p-8 text-center border-dashed border-2 border-border/30">
            <CheckCircle2 className="h-12 w-12 text-green-500/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("open.allFilmsRanked")}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {t("open.readyToSubmit")}
            </p>
          </div>
        ) : (
          movies.map((movie, index) => (
            <div
              key={movie.id}
              onDragStart={() => onDragStart(movie.id)}
              onDragEnd={onDragEnd}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <MovieVotingCard
                movie={movie}
                currentPosition={null}
                totalPositions={totalPositions}
                onPositionChange={(pos) => onPositionChange(movie.id, pos)}
                isDragging={draggingMovieId === movie.id}
                isInUnranked={true}
                onTouchDrop={onTouchDrop}
                onTouchDragPositionChange={onTouchDragPositionChange}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
