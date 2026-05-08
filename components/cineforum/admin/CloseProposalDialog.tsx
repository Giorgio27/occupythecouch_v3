import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProposalDetailDTO } from "@/lib/shared/types/cineforum";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: ProposalDetailDTO;
  loading: boolean;
  onConfirm: (winnerId: string) => void;
};

/** Dialog for selecting a winner and closing a proposal. */
export default function CloseProposalDialog({
  open,
  onOpenChange,
  proposal,
  loading,
  onConfirm,
}: Props) {
  const { t } = useTranslation("admin");
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedWinnerId) return;
    onConfirm(selectedWinnerId);
    setSelectedWinnerId(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) setSelectedWinnerId(null);
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("proposals.closeDialogTitle")}</DialogTitle>
          <DialogDescription>{t("proposals.selectWinner")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {proposal.movies.map((movie) => (
            <button
              key={movie.id}
              onClick={() => setSelectedWinnerId(movie.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent ${
                selectedWinnerId === movie.id
                  ? "border-primary bg-accent"
                  : "border-border"
              }`}
            >
              {movie.imageMedium && (
                <img
                  src={movie.imageMedium}
                  alt={movie.title}
                  className="h-16 w-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{movie.title}</p>
                <p className="text-sm text-muted-foreground">{movie.year}</p>
              </div>
              {selectedWinnerId === movie.id && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                  <svg
                    className="h-3 w-3 text-primary-foreground"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {t("proposals.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !selectedWinnerId}
          >
            {loading ? t("proposals.closing") : t("proposals.closeDialogTitle")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
