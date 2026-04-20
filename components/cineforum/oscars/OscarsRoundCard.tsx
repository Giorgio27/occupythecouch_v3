import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Crown,
  Sofa,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CouchRating } from "@/components/ui/couch-rating";
import { MovieWinnerDTO, OscarsRoundDTO } from "@/lib/shared/types/cineforum";

interface OscarsRoundCardProps {
  round: OscarsRoundDTO;
  isFirst: boolean;
  onVote: (roundId: string, movieId: string, rating: number) => Promise<void>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * External platforms (IMDB, TMDB, RT, Metacritic) use a /10 scale.
 * Cineforum uses /5. Divide external by 2 before comparing.
 */
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

// ── ExternalRatings ───────────────────────────────────────────────────────────

interface ExternalRatingsProps {
  movie: MovieWinnerDTO;
}

function ExternalRatings({ movie }: ExternalRatingsProps) {
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
            {/* Original value */}
            <span className="w-16 text-right text-xs text-muted-foreground">
              {i === 0 ? "—" : row.raw !== null ? row.raw.toFixed(2) : "N/A"}
            </span>
            {/* Normalized value */}
            <span
              className={`w-14 text-right text-xs font-bold ${row.normalized !== null ? (i === 0 ? "text-primary" : "text-foreground") : "text-muted-foreground"}`}
            >
              {row.normalized !== null ? row.normalized.toFixed(2) : "N/A"}
            </span>
            {/* Diff */}
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

// ── UserVotes ─────────────────────────────────────────────────────────────────

type SortField = "name" | "rating";
type SortDir = "asc" | "desc";

interface UserVotesProps {
  votes: MovieWinnerDTO["roundVotes"];
}

function UserVotes({ votes }: UserVotesProps) {
  const [sortField, setSortField] = useState<SortField>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...votes].sort((a, b) => {
      if (sortField === "name") {
        const na = (a.userName ?? a.user).toLowerCase();
        const nb = (b.userName ?? b.user).toLowerCase();
        return sortDir === "asc" ? na.localeCompare(nb) : nb.localeCompare(na);
      }
      return sortDir === "asc" ? a.rating - b.rating : b.rating - a.rating;
    });
  }, [votes, sortField, sortDir]);

  if (votes.length === 0) return null;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "rating" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-2.5 h-2.5" />
    ) : (
      <ArrowDown className="w-2.5 h-2.5" />
    );
  };

  return (
    <div className="oscars-comparison">
      <h4 className="oscars-comparison__title">
        <Users className="w-3.5 h-3.5" />
        Voti Utenti
      </h4>
      <div className="oscars-comparison__table">
        <div className="oscars-comparison__header">
          <button
            onClick={() => toggleSort("name")}
            className="flex-1 flex items-center gap-1 hover:text-foreground transition-colors text-left"
          >
            Utente <SortIcon field="name" />
          </button>
          <button
            onClick={() => toggleSort("rating")}
            className="w-14 flex items-center justify-end gap-1 hover:text-foreground transition-colors"
          >
            <SortIcon field="rating" /> Voto
          </button>
        </div>
        {sorted.map((v) => (
          <div key={v.user} className="oscars-comparison__row">
            <span className="flex-1 text-xs text-foreground">
              {v.userName ?? v.user}
            </span>
            <span className="w-14 text-right text-xs font-bold text-gradient">
              {v.rating.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function OscarsRoundCard({
  round,
  isFirst,
  onVote,
}: OscarsRoundCardProps) {
  // Open rounds are always expanded (voting); closed rounds start collapsed
  const [isExpanded, setIsExpanded] = useState(!round.closed || isFirst);
  const [expandedMovieId, setExpandedMovieId] = useState<string | null>(null);
  const [votingMovie, setVotingMovie] = useState<string | null>(null);

  const roundAverageRating = useMemo(() => {
    if (round.winners.length === 0) return 0;
    const total = round.winners.reduce(
      (sum, w) => sum + (w.roundRating || 0),
      0,
    );
    return Math.round((total / round.winners.length) * 100) / 100;
  }, [round.winners]);

  const handleVote = async (movieId: string, rating: number) => {
    if (round.closed) return;
    setVotingMovie(movieId);
    try {
      await onVote(round.id, movieId, rating);
    } finally {
      setVotingMovie(null);
    }
  };

  const toggleMovie = (movieId: string) => {
    setExpandedMovieId((prev) => (prev === movieId ? null : movieId));
  };

  return (
    <Card className="overflow-hidden border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md py-1">
      {/* ── Round Header (always clickable for closed rounds) ── */}
      <CardHeader
        className={`py-3 px-4 ${round.closed ? "cursor-pointer hover:bg-accent/20 transition-colors" : ""}`}
        onClick={() => round.closed && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-primary leading-tight">
                {round.name}
              </h3>
              {round.closed && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Chiuso
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{round.date}</span>
            </div>
          </div>

          {/* Collapsed summary for closed rounds */}
          {round.closed && !isExpanded && round.bests.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {round.bests.map((best) => (
                <div
                  key={best.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-xs"
                >
                  <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[120px]">
                    {best.title}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sofa className="h-3 w-3 text-primary" />
                <span className="font-semibold">{roundAverageRating}</span>
              </div>
            </div>
          )}

          {round.closed && (
            <div className="flex-shrink-0 p-1.5 rounded-md bg-accent/40">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {/* ── Movies List ── */}
      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-3">
          <div className="space-y-2">
            {round.winners.map((movie) => {
              const isWinner =
                round.closed && round.bests.some((b) => b.id === movie.id);
              const isMovieExpanded = expandedMovieId === movie.id;

              return (
                <div
                  key={movie.id}
                  className={`oscars-movie-card${isWinner ? " oscars-movie-card--winner" : ""}${round.closed ? " cursor-pointer" : ""}`}
                  onClick={() => round.closed && toggleMovie(movie.id)}
                >
                  {/* Winner crown badge */}
                  {isWinner && (
                    <div className="absolute -top-1.5 -right-1.5 z-10">
                      <div className="p-1 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}

                  {/* ── Compact movie row ── */}
                  <div className="flex items-center gap-2.5">
                    {/* Poster thumbnail */}
                    <div className="oscars-movie-card__poster">
                      {movie.imageMedium || movie.image || movie.poster ? (
                        <img
                          src={
                            movie.imageMedium ||
                            movie.image ||
                            movie.poster ||
                            ""
                          }
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sofa className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Title + proposer */}
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

                    {/* Rating area */}
                    <div
                      className="flex-shrink-0 flex flex-col items-end gap-1"
                      onClick={(e) => e.stopPropagation()} // prevent card toggle when interacting with rating
                    >
                      {round.closed ? (
                        <>
                          {movie.roundRating !== null && (
                            <div className="flex items-center gap-1 text-xs font-semibold">
                              <Sofa className="h-3 w-3 text-primary" />
                              <span>{movie.roundRating.toFixed(2)}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {isMovieExpanded ? (
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
                        /* Voting mode */
                        <div className="flex flex-col items-end gap-1">
                          <CouchRating
                            value={movie.userRating || 0}
                            onChange={(rating) => handleVote(movie.id, rating)}
                            readOnly={false}
                            disabled={votingMovie === movie.id}
                          />
                          {movie.userRating !== null &&
                            movie.userRating > 0 && (
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

                  {/* ── Expanded details (closed rounds only) ── */}
                  {round.closed && isMovieExpanded && (
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
            })}
          </div>

          {/* Round average footer */}
          {round.closed && round.winners.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Media ciclo</span>
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <Sofa className="h-3 w-3 text-primary" />
                <span>{roundAverageRating}</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
