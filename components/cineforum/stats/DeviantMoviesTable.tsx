import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/cineforum/common";
import type { UserVoteDetailDTO } from "@/lib/shared/types";

type Props = {
  movies: UserVoteDetailDTO[];
};

export default function DeviantMoviesTable({ movies }: Props) {
  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <SectionHeader
        icon={<TrendingUp className="w-4 h-4" />}
        title="Film con Maggiore Divergenza"
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Film
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Round
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tuo Voto
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Media Film
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Differenza
              </th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => (
              <tr
                key={index}
                className="border-b border-border transition-colors last:border-0 hover:bg-secondary/50"
              >
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                  {movie.movie}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {movie.round}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums text-primary">
                  {movie.user_rating.toFixed(2)}
                </td>
                <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted-foreground">
                  {movie.movie_average.toFixed(2)}
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums">
                  <span
                    className={
                      movie.user_rating > movie.movie_average
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {movie.user_rating > movie.movie_average ? "+" : ""}
                    {(movie.user_rating - movie.movie_average).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
