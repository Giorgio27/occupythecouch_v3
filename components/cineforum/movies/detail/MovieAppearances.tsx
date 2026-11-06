import { ListOrdered } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/cineforum/common";
import MovieAppearanceCard from "./MovieAppearanceCard";
import type { MovieAppearanceDTO } from "@/lib/shared/types";

type MovieAppearancesProps = { appearances: MovieAppearanceDTO[] };

/** Every proposal of the club that included the movie, newest first. */
export default function MovieAppearances({
  appearances,
}: MovieAppearancesProps): JSX.Element {
  const { t } = useTranslation("movie");

  return (
    <section className="mb-8">
      <SectionHeader
        icon={<ListOrdered className="w-4 h-4" />}
        title={t("appearances.title")}
        subtitle={t("appearances.subtitle", { count: appearances.length })}
      />
      <ul className="space-y-3">
        {appearances.map((appearance) => (
          <MovieAppearanceCard
            key={appearance.proposalId}
            appearance={appearance}
          />
        ))}
      </ul>
    </section>
  );
}
