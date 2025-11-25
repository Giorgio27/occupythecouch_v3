import * as React from "react";
import { Button } from "@/components/ui/button";

/** Single movie row with rank buttons (1°,2°,...) */
export default function MovieRankRow({
  movie,
  lists,
  setLists,
}: {
  movie: any;
  lists: Record<string, any[]>;
  setLists: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}) {
  const ranks = React.useMemo(() => {
    const keys = Object.keys(lists)
      .map((k) => parseInt(k))
      .sort((a, b) => a - b);
    return keys.length ? keys : [1];
  }, [lists]);

  const isInRank = (rank: number) =>
    (lists[String(rank)] || []).some((m) => m.id === movie.id);

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

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-3">
      <div className="min-w-0">
        <div className="truncate font-medium">
          {movie.title} {movie.year ? `(${movie.year})` : ""}
        </div>
        <div className="text-xs text-muted-foreground">
          {movie.director || movie.actors || ""}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        {ranks.map((r) => (
          <Button
            key={r}
            variant={isInRank(r) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleRank(r)}
            className="w-10"
            title={`${r}°`}
          >
            {r}°
          </Button>
        ))}
      </div>
    </div>
  );
}
