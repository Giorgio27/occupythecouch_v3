import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { resendProposalNotification } from "@/lib/client/cineforum/admin-proposal-notifications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Status = "idle" | "sending" | "sent" | "error";

export type ResendProposalNotificationButtonProps = {
  cineforumId: string;
  proposalId: string;
  disabled: boolean;
};

/** Resends the "new proposal" Telegram message, after a confirmation (it posts to the group). */
export default function ResendProposalNotificationButton({
  cineforumId,
  proposalId,
  disabled,
}: ResendProposalNotificationButtonProps) {
  const { t } = useTranslation("admin");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const isSending = status === "sending";

  const handleConfirm = async (): Promise<void> => {
    setStatus("sending");
    try {
      await resendProposalNotification(cineforumId, proposalId);
      setStatus("sent");
      setOpen(false);
    } catch (err: unknown) {
      console.error("Failed to resend proposal notification", err);
      setStatus("error");
    }
  };

  const handleOpenChange = (value: boolean): void => {
    if (value) setStatus("idle");
    setOpen(value);
  };

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        disabled={disabled || isSending}
        variant="outline"
        size="sm"
      >
        <Send className="mr-1 h-3 w-3" />
        {status === "sent"
          ? t("proposals.resendSent")
          : t("proposals.resendTelegram")}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("proposals.resendTelegram")}</DialogTitle>
            <DialogDescription>
              {t("proposals.resendConfirm")}
            </DialogDescription>
          </DialogHeader>
          {status === "error" && (
            <p className="text-sm text-destructive">
              {t("proposals.resendError")}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSending}
            >
              {t("proposals.cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSending}
            >
              {isSending
                ? t("proposals.resendSending")
                : t("proposals.resendTelegram")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
