import { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Star, Trophy, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/cineforum/common";
import RankedMovieDetail from "./RankedMovieDetail";
import type { UserRankedMovieDTO } from "@/lib/shared/types";

type Props = {
  movies: UserRankedMovieDTO[];
  userName: string;
};

export default function UserRankedMoviesTable({ movies, userName }: Props) {
  const { t } = useTranslation("stats");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <SectionHeader
        icon={<Star className="w-4 h-4" />}
        title={t("users.rankedMoviesTitle", { user: userName })}
        subtitle={t("users.rankedMoviesSubtitle")}
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 w-10" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("users.colMovie")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("users.colRound")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("users.colYourRating")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("users.colMovieAvg")}
              </th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => {
              const key = `${movie.roundId}-${movie.movieId}`;
              const isExpanded = expandedRows.has(key);
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => toggleRow(key)}
                    className={`border-b border-border transition-colors cursor-pointer hover:bg-secondary/50 ${
                      isExpanded ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                      <span className="inline-flex items-center gap-2">
                        {movie.movie}
                        {movie.roundWinner && (
                          <span
                            title={t("users.winnerTitle", {
                              round: movie.round,
                            })}
                          >
                            <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {movie.round}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums text-primary">
                      {movie.userRating.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted-foreground">
                      {movie.movieAverage !== null
                        ? movie.movieAverage.toFixed(2)
                        : "N/A"}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-border">
                      <td colSpan={5} className="px-4 py-4 bg-secondary/30">
                        <RankedMovieDetail movie={movie} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
