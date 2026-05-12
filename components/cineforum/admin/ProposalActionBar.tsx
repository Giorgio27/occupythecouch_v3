import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProposalDetailDTO } from "@/lib/shared/types/cineforum";

type Props = {
  proposal: ProposalDetailDTO;
  loading: boolean;
  onEdit: () => void;
  onOpenCloseDialog: () => void;
  onReopen: () => void;
  onToggleResults: () => void;
};

/** Action buttons row for the admin proposal panel (edit, close, reopen, toggle results). */
export default function ProposalActionBar({
  proposal,
  loading,
  onEdit,
  onOpenCloseDialog,
  onReopen,
  onToggleResults,
}: Props) {
  const { t } = useTranslation("admin");

  const canReopen = proposal.closed && !proposal.roundClosed;
  const hasVotes = proposal.votes && proposal.votes.length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 pt-1">
        {/* Edit */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={
                proposal.closed || hasVotes ? "cursor-not-allowed" : ""
              }
            >
              <Button
                onClick={onEdit}
                disabled={loading || proposal.closed || hasVotes}
                variant="outline"
                size="sm"
              >
                {t("proposals.edit")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {proposal.closed
              ? t("proposals.cannotEdit")
              : hasVotes
                ? t("proposals.cannotEditWithVotes")
                : t("proposals.edit")}
          </TooltipContent>
        </Tooltip>

        {/* Close */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={proposal.closed ? "cursor-not-allowed" : ""}>
              <Button
                onClick={onOpenCloseDialog}
                disabled={loading || proposal.closed}
                variant={proposal.closed ? "outline" : "default"}
                size="sm"
              >
                {t("proposals.close")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {proposal.closed
              ? t("proposals.statusClosed")
              : t("proposals.closeDialogTitle")}
          </TooltipContent>
        </Tooltip>

        {/* Reopen */}
        {canReopen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onReopen}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {t("proposals.reopen")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("proposals.reopen")}</TooltipContent>
          </Tooltip>
        )}

        {/* Toggle results */}
        {!proposal.closed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onToggleResults}
                disabled={loading}
                variant={proposal.show_results ? "secondary" : "outline"}
                size="sm"
              >
                {t("proposals.toggleResults")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("proposals.toggleResults")}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
