import { useTranslation } from "react-i18next";
import type { MovieBallotDTO } from "@/lib/shared/types";

type MovieBallotsProps = { ballots: MovieBallotDTO[] };

/** Each member's placement of the movie in one proposal, best first. */
export default function MovieBallots({
  ballots,
}: MovieBallotsProps): JSX.Element {
  const { t } = useTranslation("movie");

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("appearances.ballots")}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {ballots.map((ballot, index) => (
          <li
            key={`${ballot.userName}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs"
          >
            <span className="text-foreground">{ballot.userName}</span>
            <span className="font-bold text-primary tabular-nums">
              {ballot.rank === null
                ? t("appearances.unranked")
                : `#${ballot.rank}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
