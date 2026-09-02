import { Crown } from "lucide-react";
import type { UserRankingDTO } from "@/lib/shared/types";

type Props = {
  ranking: UserRankingDTO;
  position: number;
  rating: number | null;
  wins: number;
};

/** One row of the user rankings table. */
export default function UserRankingTableRow({
  ranking,
  position,
  rating,
  wins,
}: Props) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
      <td className="px-4 py-3.5 text-sm font-bold text-muted-foreground tabular-nums">
        {position}
      </td>
      <td className="px-4 py-3.5 text-sm font-medium text-foreground">
        <div className="flex items-center gap-2">
          {ranking.user}
          {wins > 0 && <Crown className="w-4 h-4 text-yellow-500" />}
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums">
        {rating !== null ? (
          <span className="text-gradient">{rating.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-right tabular-nums">
        {ranking.weighted_average_rating !== null ? (
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {ranking.weighted_average_rating.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-right text-muted-foreground tabular-nums">
        {ranking.movie_round_rankings.length}
      </td>
      <td className="px-4 py-3.5 text-sm text-right tabular-nums">
        {wins > 0 ? (
          <span className="text-yellow-500 font-bold">{wins}</span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
    </tr>
  );
}
