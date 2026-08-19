import { useTranslation } from "react-i18next";
import { User, CalendarDays } from "lucide-react";
import ComparisonTable from "@/components/cineforum/rankings/ComparisonTable";
import type { UserRankedMovieDTO } from "@/lib/shared/types";
import i18n from "@/lib/i18n";

type Props = {
  movie: UserRankedMovieDTO;
};

function formatDate(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(i18n.language, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Accordion body for a single row of UserRankedMoviesTable: proposer, dates and platform votes. */
export default function RankedMovieDetail({ movie }: Props) {
  const { t } = useTranslation("stats");
  const notAvailable = t("users.notAvailable");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg border border-border text-xs">
          <User className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">
            {t("users.proposedByLabel")}
          </span>
          <span className="font-semibold text-foreground">{movie.owner}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg border border-border text-xs">
          <CalendarDays className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">
            {t("users.proposedOnLabel")}
          </span>
          <span className="font-semibold text-foreground">
            {formatDate(movie.proposalDate, notAvailable)}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg border border-border text-xs">
          <CalendarDays className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">
            {t("users.roundDateLabel")}
          </span>
          <span className="font-semibold text-foreground">
            {formatDate(movie.roundDate, notAvailable)}
          </span>
        </div>
      </div>

      <ComparisonTable
        title={t("users.comparisonTitle")}
        rows={[
          { label: "Cineforum", value: movie.movieAverage, difference: null },
          { label: "TMDB", value: movie.tmdbVote, difference: null },
          { label: "IMDB", value: movie.imdbRating, difference: null },
          {
            label: "Rotten Tomatoes",
            value: movie.tomatometer,
            difference: null,
          },
          { label: "Metacritic", value: movie.metascore, difference: null },
        ]}
      />
    </div>
  );
}
