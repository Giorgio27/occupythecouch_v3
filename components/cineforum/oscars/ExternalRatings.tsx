import { Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MovieWinnerDTO } from "@/lib/shared/types/cineforum";

function normalizeExternal(value: number | null): number | null {
  if (value === null) return null;
  return Math.round((value / 2) * 100) / 100;
}

function parseDiff(
  cineforum: number | null,
  externalRaw: number | null,
): { value: number; trend: "up" | "down" | "neutral" } | null {
  const external = normalizeExternal(externalRaw);
  if (cineforum === null || external === null) return null;
  const diff = cineforum - external;
  return {
    value: Math.abs(diff),
    trend: diff > 0.005 ? "up" : diff < -0.005 ? "down" : "neutral",
  };
}

interface ExternalRatingsProps {
  movie: MovieWinnerDTO;
}

export default function ExternalRatings({ movie }: ExternalRatingsProps) {
  const rows = [
    {
      label: "Cineforum",
      raw: movie.roundRating,
      normalized: movie.roundRating,
      diff: null,
    },
    {
      label: "TMDB",
      raw: movie.tmdbVote,
      normalized: normalizeExternal(movie.tmdbVote),
      diff: parseDiff(movie.roundRating, movie.tmdbVote),
    },
    {
      label: "IMDB",
      raw: movie.imdbRating,
      normalized: normalizeExternal(movie.imdbRating),
      diff: parseDiff(movie.roundRating, movie.imdbRating),
    },
    {
      label: "Rotten Tomatoes",
      raw: movie.tomatometer,
      normalized: normalizeExternal(movie.tomatometer),
      diff: parseDiff(movie.roundRating, movie.tomatometer),
    },
    {
      label: "Metacritic",
      raw: movie.metascore,
      normalized: normalizeExternal(movie.metascore),
      diff: parseDiff(movie.roundRating, movie.metascore),
    },
  ];

  const hasAnyExternal =
    movie.tmdbVote !== null ||
    movie.imdbRating !== null ||
    movie.tomatometer !== null ||
    movie.metascore !== null;

  if (!hasAnyExternal) return null;

  return (
    <div className="oscars-comparison">
      <h4 className="oscars-comparison__title">
        <Globe className="w-3.5 h-3.5" />
        Confronto Siti
        <span className="text-[9px] font-normal text-muted-foreground normal-case tracking-normal ml-1">
          (piattaforme /10 → /5)
        </span>
      </h4>
      <div className="oscars-comparison__table">
        <div className="oscars-comparison__header">
          <span className="flex-1">Sito</span>
          <span className="w-16 text-right">Originale</span>
          <span className="w-14 text-right">Norm.</span>
          <span className="w-16 text-right">Diff</span>
        </div>
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`oscars-comparison__row${i === 0 ? " oscars-comparison__row--primary" : ""}`}
          >
            <span
              className={`flex-1 text-xs ${i === 0 ? "font-bold text-primary" : "text-foreground"}`}
            >
              {row.label}
              {i === 0 && (
                <span className="ml-1.5 cine-badge text-[10px] py-0 px-1.5">
                  Noi
                </span>
              )}
            </span>
            <span className="w-16 text-right text-xs text-muted-foreground">
              {i === 0 ? "—" : row.raw !== null ? row.raw.toFixed(2) : "N/A"}
            </span>
            <span
              className={`w-14 text-right text-xs font-bold ${row.normalized !== null ? (i === 0 ? "text-primary" : "text-foreground") : "text-muted-foreground"}`}
            >
              {row.normalized !== null ? row.normalized.toFixed(2) : "N/A"}
            </span>
            <span className="w-16 text-right">
              {row.diff ? (
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    row.diff.trend === "up"
                      ? "text-green-400 bg-green-400/10"
                      : row.diff.trend === "down"
                        ? "text-red-400 bg-red-400/10"
                        : "text-muted-foreground bg-secondary"
                  }`}
                >
                  {row.diff.trend === "up" && (
                    <TrendingUp className="w-2.5 h-2.5" />
                  )}
                  {row.diff.trend === "down" && (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {row.diff.trend === "neutral" && (
                    <Minus className="w-2.5 h-2.5" />
                  )}
                  {row.diff.value.toFixed(2)}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
