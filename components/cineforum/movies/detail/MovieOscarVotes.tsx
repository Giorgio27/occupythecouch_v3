import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import type { MovieOscarVoteDTO } from "@/lib/shared/types";

type MovieOscarVotesProps = { votes: MovieOscarVoteDTO[] };

/** Highest Oscars rating, used to size the bars. */
const MAX_RATING = 5;

/** Every member's Oscars rating as a bar, highest first; the viewer's row is highlighted. */
export default function MovieOscarVotes({
  votes,
}: MovieOscarVotesProps): JSX.Element {
  const { t } = useTranslation("movie");
  const { data: session } = useSession();
  const viewerId = session?.user?.id ?? null;

  if (votes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("oscars.noVotes")}</p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {votes.map((vote) => {
        const isViewer = vote.userId === viewerId;
        return (
          <li
            key={vote.userId}
            className={`flex items-center gap-3 rounded-lg px-2 py-1 ${isViewer ? "bg-primary/10" : ""}`}
          >
            <span className="w-28 shrink-0 truncate text-sm text-foreground sm:w-40">
              {vote.userName}
              {isViewer && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {t("oscars.you")}
                </span>
              )}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${(vote.rating / MAX_RATING) * 100}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
              {vote.rating.toFixed(2)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
