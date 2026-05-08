import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Vote } from "lucide-react";

type VotingFooterProps = {
  canVote: boolean;
  hasExistingVote: boolean;
  submitting: boolean;
  hasUnranked: boolean;
  onSubmit: () => void;
};

export default function VotingFooter({
  canVote,
  hasExistingVote,
  submitting,
  hasUnranked,
  onSubmit,
}: VotingFooterProps) {
  const { t } = useTranslation("proposal");

  return (
    <>
      {!canVote && (
        <div className="cine-card p-3 bg-primary/10 border-primary/30 animate-fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary/90">{t("open.votingClosed")}</p>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {canVote
              ? hasExistingVote
                ? t("open.updateVoteTitle")
                : t("open.confirmVoteTitle")
              : t("open.votingConcludedTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {canVote
              ? hasExistingVote
                ? t("open.updateVoteSubtitle")
                : t("open.confirmVoteSubtitle")
              : t("open.votingConcludedSubtitle")}
          </p>
        </div>

        <Button
          className="cine-btn h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl"
          disabled={!canVote || submitting || hasUnranked}
          onClick={onSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("open.submitting")}
            </>
          ) : (
            <>
              <Vote className="h-5 w-5" />
              {hasExistingVote
                ? t("open.updateButton")
                : t("open.confirmButton")}
            </>
          )}
        </Button>
      </div>
    </>
  );
}
