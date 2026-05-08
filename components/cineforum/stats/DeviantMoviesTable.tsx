import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserVoteDetailDTO } from "@/lib/shared/types";

type Props = {
  movies: UserVoteDetailDTO[];
};

export default function DeviantMoviesTable({ movies }: Props) {
  return (
    <div className="cine-card p-6 mb-8">
      <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Film con Maggiore Divergenza
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Film
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Round
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tuo Voto
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Media Film
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Differenza
              </th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => (
              <tr
                key={index}
                className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
              >
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                  {movie.movie}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {movie.round}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums text-primary">
                  {movie.user_rating.toFixed(2)}
                </td>
                <td className="px-4 py-3.5 text-sm text-right tabular-nums text-muted-foreground">
                  {movie.movie_average.toFixed(2)}
                </td>
                <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums">
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
