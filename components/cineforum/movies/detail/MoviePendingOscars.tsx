import { useTranslation } from "react-i18next";
import { InfoNote } from "@/components/cineforum/common";
import type { MoviePendingOscarsDTO } from "@/lib/shared/types";

type MoviePendingOscarsProps = { pending: MoviePendingOscarsDTO };

/** An Oscars vote still running: how many voted and the viewer's own rating, nothing else. */
export default function MoviePendingOscars({
  pending,
}: MoviePendingOscarsProps): JSX.Element {
  const { t } = useTranslation("movie");
  const mine =
    pending.myRating === null
      ? t("oscars.pendingNotMine")
      : t("oscars.pendingMine", { rating: pending.myRating.toFixed(2) });

  return (
    <InfoNote
      title={t("oscars.pendingTitle", { round: pending.roundName })}
      paragraphs={[
        `${t("oscars.pendingCount", { count: pending.voteCount })} ${mine}`,
        t("oscars.pendingHidden"),
      ]}
    />
  );
}
