import { Medal } from "lucide-react";
import { ReactNode } from "react";
import { ExpandableListItem } from "@/components/cineforum/common";

type RankingCardProps = {
  position: number;
  title: string;
  rating: number | null;
  isExpanded: boolean;
  onToggle: () => void;
  badges?: ReactNode;
  children?: ReactNode;
};

/** Tailwind class for the medal icon at each top-3 position */
function getMedalColor(position: number): string | null {
  switch (position) {
    case 1:
      return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
    case 2:
      return "text-gray-300 drop-shadow-[0_0_6px_rgba(209,213,219,0.4)]";
    case 3:
      return "text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]";
    default:
      return null;
  }
}

/** Tailwind gradient class for the row background at each top-3 position */
function getPositionBg(position: number): string | undefined {
  switch (position) {
    case 1:
      return "bg-linear-to-r from-yellow-500/20 via-yellow-500/5 to-transparent";
    case 2:
      return "bg-linear-to-r from-gray-400/15 via-gray-400/5 to-transparent";
    case 3:
      return "bg-linear-to-r from-amber-600/15 via-amber-600/5 to-transparent";
    default:
      return undefined;
  }
}

export default function RankingCard({
  position,
  title,
  rating,
  isExpanded,
  onToggle,
  badges,
  children,
}: RankingCardProps) {
  const medalColor = getMedalColor(position);

  const positionNode = medalColor ? (
    <Medal
      className={`w-6 h-6 sm:w-7 sm:h-7 ${medalColor} transition-transform group-hover:scale-110`}
    />
  ) : (
    position
  );

  const metricNode =
    rating !== null ? (
      <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent font-bold text-base sm:text-lg tabular-nums">
        {rating.toFixed(2)}
      </span>
    ) : (
      <span className="font-bold text-base sm:text-lg tabular-nums text-muted-foreground">
        N/A
      </span>
    );

  return (
    <ExpandableListItem
      position={positionNode}
      title={title}
      badges={badges}
      metric={metricNode}
      isExpanded={isExpanded}
      onToggle={onToggle}
      highlightBg={getPositionBg(position)}
    >
      {children}
    </ExpandableListItem>
  );
}
