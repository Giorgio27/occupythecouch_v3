import * as React from "react";
import { Button } from "@/components/ui/button";
import { Film, Star } from "lucide-react";

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

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-3 sm:p-4 transition-all duration-300 hover:border-primary/40 hover:bg-secondary/40">
      {/* subtle hover glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-center gap-3">
        {/* Poster / fallback icon */}
        <div className="shrink-0">
          {movie?.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              src={movie.poster}
              className="h-14 w-10 rounded-md border border-border/60 object-cover"
            />
          ) : (
            <div className="flex h-14 w-10 items-center justify-center rounded-md border border-border/60 bg-secondary">
              <Film className="h-4 w-4 text-primary/70" />
            </div>
          )}
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
