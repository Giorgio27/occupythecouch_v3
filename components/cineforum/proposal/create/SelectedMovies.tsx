import { useTranslation } from "react-i18next";
import MovieCard from "./MovieCard";

type Movie = {
  id: string;
  l: string;
  y?: string;
  s?: string;
  i?: string[];
};

type SelectedMoviesProps = {
  items: Movie[];
  onRemove: (movie: Movie) => void;
  previousWinnerIds?: Set<string>;
};

export default function SelectedMovies({
  items,
  onRemove,
  previousWinnerIds,
}: SelectedMoviesProps) {
  const { t } = useTranslation("proposal");

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{t("create.selectedMovies")}</div>
        <div className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "film" : "film"}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {items.map((m) => (
          <MovieCard
            key={m.id}
            movie={m}
            isSelected={true}
            isPreviousWinner={previousWinnerIds?.has(m.id) ?? false}
            onToggle={onRemove}
            variant="selected"
          />
        ))}
      </div>
    </div>
  );
}
