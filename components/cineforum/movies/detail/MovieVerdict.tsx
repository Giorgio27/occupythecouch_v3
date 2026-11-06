import { useTranslation } from "react-i18next";
import ComparisonTable from "@/components/cineforum/rankings/ComparisonTable";
import { toFiveScale } from "@/lib/shared/ranking/scale";
import type { MovieInfoDTO, MovieOscarsDTO } from "@/lib/shared/types";

type MovieVerdictProps = {
  movie: MovieInfoDTO;
  oscars: MovieOscarsDTO[];
};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Platform minus club, signed like the movies ranking ("+0.25" = the platform
 * rates it higher), so the shared table reads the same everywhere.
 */
function differenceLabel(
  platform: number | null,
  club: number | null,
): string | null {
  if (platform === null || club === null) return null;
  const diff = parseFloat((platform - club).toFixed(2));
  return diff >= 0 ? `+${diff}` : `${diff}`;
}

/** The club's Oscars average next to the platforms, every value on a /5 scale. */
export default function MovieVerdict({
  movie,
  oscars,
}: MovieVerdictProps): JSX.Element {
  const { t } = useTranslation("movie");

  const clubAverage = mean(
    oscars.map((o) => o.averageRating).filter((r): r is number => r !== null),
  );
  const platforms = [
    { label: "TMDB", value: toFiveScale(movie.tmdbVote) },
    { label: "IMDB", value: toFiveScale(movie.imdbRating) },
    { label: "Rotten Tomatoes", value: toFiveScale(movie.tomatometer) },
    { label: "Metacritic", value: toFiveScale(movie.metascore) },
  ];

  return (
    <section className="mb-8">
      <ComparisonTable
        title={t("verdict.title")}
        rows={[
          { label: "Cineforum", value: clubAverage, difference: null },
          ...platforms.map((p) => ({
            label: p.label,
            value: p.value,
            difference: differenceLabel(p.value, clubAverage),
          })),
        ]}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {t("verdict.subtitle")}
      </p>
    </section>
  );
}
