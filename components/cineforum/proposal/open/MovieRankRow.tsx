import * as React from "react";
import { Button } from "@/components/ui/button";
import { Star, GripVertical } from "lucide-react";
import MoviePoster from "@/components/ui/MoviePoster";

/** Single movie row with rank buttons (1°,2°,...) and drag-and-drop */
export default function MovieRankRow({
  movie,
  lists,
  setLists,
}: {
  movie: any;
  lists: Record<string, any[]>;
  setLists: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOver, setDragOver] = React.useState<"top" | "bottom" | null>(null);

  const ranks = React.useMemo(() => {
    const keys = Object.keys(lists)
      .map((k) => parseInt(k))
      .sort((a, b) => a - b);
    return keys.length ? keys : [1];
  }, [lists]);

  const isInRank = (rank: number) =>
    (lists[String(rank)] || []).some((m) => m.id === movie.id);

  const currentRank = React.useMemo(() => {
    for (const r of ranks) if (isInRank(r)) return r;
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, movie.id]);

  const toggleRank = (rank: number) => {
    setLists((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = next[k].filter((m) => m.id !== movie.id);
      }
      next[String(rank)] = [...(next[String(rank)] || []), movie];
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        movieId: movie.id,
        currentRank,
      }),
    );
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Determine if we're in the top or bottom half
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setDragOver(e.clientY < midpoint ? "top" : "bottom");
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const draggedMovieId = data.movieId;
      const draggedCurrentRank = data.currentRank;

      if (draggedMovieId === movie.id) return;

      setLists((prev) => {
        const next = { ...prev };

        // Find the dragged movie
        let draggedMovie: any = null;
        for (const k of Object.keys(next)) {
          const found = next[k].find((m: any) => m.id === draggedMovieId);
          if (found) {
            draggedMovie = found;
            break;
          }
        }

        if (!draggedMovie) return prev;

        // Remove dragged movie from all ranks
        for (const k of Object.keys(next)) {
          next[k] = next[k].filter((m: any) => m.id !== draggedMovieId);
        }

        const targetRank = currentRank;
        if (targetRank === null) return prev;

        // Determine drop position based on dragOver state
        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const dropPosition = e.clientY < midpoint ? "top" : "bottom";

        if (dropPosition === "top") {
          // Insert at a higher rank (lower number)
          // If target is rank 3, insert at rank 3 and shift others down
          const newRank = targetRank;

          // Shift all movies at newRank and below down by 1
          const maxRank = Math.max(
            ...Object.keys(next).map((k) => parseInt(k)),
          );
          for (let r = maxRank; r >= newRank; r--) {
            if (next[String(r)] && next[String(r)].length > 0) {
              next[String(r + 1)] = next[String(r)];
            }
          }

          // Place dragged movie at newRank
          next[String(newRank)] = [draggedMovie];
        } else {
          // Insert at same rank (pari merito) or below
          // Add to the same rank as target
          next[String(targetRank)] = [
            ...(next[String(targetRank)] || []),
            draggedMovie,
          ];
        }

        // Clean up empty ranks and renumber
        const cleanedLists: Record<string, any[]> = {};
        const sortedRanks = Object.keys(next)
          .map((k) => parseInt(k))
          .sort((a, b) => a - b)
          .filter((r) => next[String(r)] && next[String(r)].length > 0);

        let newRankCounter = 1;
        for (const oldRank of sortedRanks) {
          cleanedLists[String(newRankCounter)] = next[String(oldRank)];
          newRankCounter++;
        }

        return cleanedLists;
      });
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        "group relative overflow-hidden rounded-xl border p-3 sm:p-4 transition-all duration-300",
        isDragging
          ? "opacity-50 border-primary/60 bg-primary/10"
          : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-secondary/40",
        dragOver === "top" && "border-t-4 border-t-primary",
        dragOver === "bottom" && "border-b-4 border-b-primary",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Drop zone indicators */}
      {dragOver === "top" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse" />
      )}
      {dragOver === "bottom" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-pulse" />
      )}

      {/* subtle hover glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-center gap-3">
        {/* Drag handle */}
        <div className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors">
          <GripVertical className="h-5 w-5" />
        </div>
        {/* Poster / fallback icon */}
        <div className="shrink-0">
          <MoviePoster
            imageMedium={movie.imageMedium ?? null}
            poster={movie.poster ?? null}
            image={movie.image ?? null}
            imdbId={movie.imdbId ?? null}
            alt=""
            className="h-14 w-10 rounded-md border border-border/60 object-cover"
            placeholderClassName="h-14 w-10 rounded-md border border-border/60 bg-muted flex items-center justify-center"
          />
        </div>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm sm:text-base font-semibold">
                {movie.title} {movie.year ? `(${movie.year})` : ""}
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {movie.director || movie.actors || ""}
              </div>
            </div>

            {/* Current rank badge */}
            {currentRank != null && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Star className="h-3.5 w-3.5 fill-primary/20 text-primary" />
                {currentRank}°
              </span>
            )}
          </div>
        </div>

        {/* Rank buttons */}
        <div className="shrink-0 flex items-center gap-1.5">
          {ranks.map((r) => {
            const active = isInRank(r);
            return (
              <Button
                key={r}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => toggleRank(r)}
                title={`${r}°`}
                className={[
                  "h-9 w-11 rounded-full transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-cine-red-soft"
                    : "bg-transparent hover:bg-secondary/60 hover:border-primary/40",
                ].join(" ")}
              >
                {r}°
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
