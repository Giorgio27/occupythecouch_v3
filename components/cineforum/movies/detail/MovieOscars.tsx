import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/cineforum/common";
import MovieOscarsCard from "./MovieOscarsCard";
import MoviePendingOscars from "./MoviePendingOscars";
import type { MovieOscarsDTO, MoviePendingOscarsDTO } from "@/lib/shared/types";

type MovieOscarsProps = {
  oscars: MovieOscarsDTO[];
  pendingOscars: MoviePendingOscarsDTO[];
};

/**
 * Oscars results in closed rounds, plus a notice for any vote still running.
 * The page hides the section for a movie that was never watched.
 */
export default function MovieOscars({
  oscars,
  pendingOscars,
}: MovieOscarsProps): JSX.Element {
  const { t } = useTranslation("movie");

  return (
    <section className="mb-8">
      <SectionHeader
        icon={<Trophy className="w-4 h-4" />}
        title={t("oscars.title")}
        subtitle={t("oscars.subtitle")}
      />
      <div className="space-y-6">
        {pendingOscars.map((pending) => (
          <MoviePendingOscars key={pending.roundId} pending={pending} />
        ))}
        {oscars.map((result) => (
          <MovieOscarsCard key={result.roundId} oscars={result} />
        ))}
      </div>
    </section>
  );
}
