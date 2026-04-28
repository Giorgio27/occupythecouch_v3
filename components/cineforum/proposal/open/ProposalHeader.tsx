import { useTranslation } from "react-i18next";
import { ExpandableText } from "@/components/ui/expandable-text";
import { CalendarDays, Film, Sparkles, Trophy } from "lucide-react";
import ProposalOwnerBadge from "@/components/cineforum/proposal/shared/ProposalOwnerBadge";

type ProposalHeaderProps = {
  proposal: any;
  canVote: boolean;
};

export default function ProposalHeader({
  proposal,
  canVote,
}: ProposalHeaderProps) {
  const { t } = useTranslation("proposal");

  return (
    <div className="cine-card cine-glass relative overflow-hidden border-primary/20">
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
      <div className="relative space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="cine-badge animate-scale-in">
                <Sparkles className="mr-2 h-4 w-4" />
                {t("open.badge")}
              </span>
              {!canVote && (
                <span className="cine-badge bg-primary/30 text-primary animate-scale-in delay-100">
                  <Trophy className="mr-2 h-4 w-4" />
                  {t("open.resultsVisibleBadge")}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-balance">
                <span className="text-gradient">{t("open.proposalTitle")}</span>{" "}
                <span className="text-foreground/90">— {proposal.title}</span>
              </h2>
              {!!proposal?.description && (
                <div className="mt-3">
                  <ExpandableText
                    text={proposal.description}
                    maxLength={200}
                    className="prose prose-sm max-w-none prose-invert prose-p:text-muted-foreground prose-strong:text-foreground"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {proposal?.owner && <ProposalOwnerBadge owner={proposal.owner} />}
            {proposal?.date && (
              <div className="cine-badge bg-muted/50">
                <CalendarDays className="mr-2 h-4 w-4" />
                {proposal.date}
              </div>
            )}
            <div className="cine-badge bg-muted/50">
              <Film className="mr-2 h-4 w-4" />
              {t("open.moviesCount", { count: proposal?.movies?.length ?? 0 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
