import { Film } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ExpandableListItem,
  SectionHeader,
} from "@/components/cineforum/common";
import DirectorMoviesTable from "./DirectorMoviesTable";
import type { DirectorRankingDTO } from "@/lib/shared/types";

type DirectorCardProps = {
  director: DirectorRankingDTO;
  position: number;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function DirectorCard({
  director,
  position,
  isExpanded,
  onToggle,
}: DirectorCardProps) {
  const { t } = useTranslation("rankings");

  return (
    <ExpandableListItem
      position={position}
      title={director.name}
      metric={director.average_rating.toFixed(2)}
      metricClassName="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <SectionHeader
        icon={<Film className="w-4 h-4" />}
        title={t("directors.moviesSection")}
      />
      <DirectorMoviesTable movies={director.movies} />
    </ExpandableListItem>
  );
}
