import { Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ProposalMovieDTO,
  ProposalVoteDTO,
} from "@/lib/shared/types/cineforum";
import { useTranslation } from "react-i18next";

type ProposalVotesAccordionProps = {
  votes: ProposalVoteDTO[];
  movies: ProposalMovieDTO[];
  /** Namespace for translations: "admin" or "rankings" */
  tNamespace?: string;
};

export default function ProposalVotesAccordion({
  votes,
  movies,
  tNamespace = "rankings",
}: ProposalVotesAccordionProps) {
  const { t } = useTranslation(tNamespace);

  if (!votes || votes.length === 0) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="votes" className="border-0">
        <AccordionTrigger className="rounded-xl border border-border/60 bg-card/50 px-3 py-2.5 hover:no-underline hover:bg-card/80 transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">
              {t("proposals.individualVotes")}
            </span>
            <span className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
              {votes.length}
            </span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pt-2 pb-0">
          <div className="space-y-2">
            {votes.map((vote) => (
              <div
                key={vote.id}
                className="rounded-xl border border-border/60 bg-secondary/20 p-3"
              >
                {/* Vote header */}
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {vote.user.name ?? `User ${vote.user.id.slice(0, 8)}`}
                  </span>
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                    {Object.keys(vote.movie_selection).length}{" "}
                    {t("proposals.ranksLabel")}
                  </span>
                </div>

                {/* Ranked choices */}
                <div className="space-y-1.5">
                  {Object.keys(vote.movie_selection)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((rank) => {
                      const movieIds = vote.movie_selection[rank] as string[];
                      const movieTitles = movieIds
                        .map((id) => movies.find((m) => m.id === id)?.title)
                        .filter(Boolean) as string[];

                      return (
                        <div key={rank} className="flex items-start gap-2">
                          <div className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary tabular-nums">
                            {rank}°
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {movieTitles.map((title, i) => (
                              <div
                                key={i}
                                className="rounded-full border border-border/60 bg-secondary/50 px-2 py-0.5 text-xs"
                              >
                                {title}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
