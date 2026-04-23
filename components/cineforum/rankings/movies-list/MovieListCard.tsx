import { Star } from "lucide-react";
import type { MovieStatsDTO } from "@/lib/shared/types";

type MovieListCardProps = {
  movie: MovieStatsDTO;
  position: number;
};

export default function MovieListCard({ movie, position }: MovieListCardProps) {
  return (
    <div className="cine-card-fit hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6">
        <div className="w-12 sm:w-16 text-center font-bold text-lg sm:text-xl text-gradient tabular-nums">
          {position}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base text-foreground">
              {movie.title}
            </span>
            {movie.wins > 0 && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
        </div>
        <div className="w-24 sm:w-32 text-right">
          <span className="font-bold text-sm sm:text-base text-gradient tabular-nums">
            {movie.wins} / {movie.proposals}
          </span>
        </div>
      </div>
    </div>
  );
}
