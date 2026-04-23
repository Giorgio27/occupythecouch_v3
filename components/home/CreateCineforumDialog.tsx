"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { createCineforum } from "@/lib/client/cineforum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDesc,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Clapperboard } from "lucide-react";

const NAME_PRESETS = [
  "Venerdi Noir",
  "Cinema & Pizza",
  "Anime Night",
  "A24 Club",
  "Notti in citta",
  "Horror & Popcorn",
];

type CreateCineforumDialogProps = {
  onCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function CreateCineforumDialog({
  onCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: CreateCineforumDialogProps) {
  const { t } = useTranslation("cineforum");
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (externalOnOpenChange ?? setInternalOpen)
    : setInternalOpen;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onCreate() {
    setError(null);
    const clean = name.trim();
    if (clean.length < 2) {
      setError(t("home.nameTooShort"));
      return;
    }
    try {
      await createCineforum({ name: clean });
      onCreated();
      setOpen(false);
      setName("");
      startTransition(() => {
        try {
          router.refresh?.();
        } catch {
          window.location.reload();
        }
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("home.createError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cine-btn h-10 px-5 text-sm">
          <Plus className="h-4 w-4 mr-2" />
          {t("home.createButton")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-125 border-border/50 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clapperboard className="h-5 w-5 text-primary" />
            </div>
            {t("home.dialogTitle")}
          </DialogTitle>
          <DialogDesc className="text-muted-foreground">
            {t("home.dialogDesc")}
          </DialogDesc>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t("home.nameLabel")}
              </label>
              <span className="text-xs text-muted-foreground">
                {name.trim().length}/40
              </span>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder={t("home.namePlaceholder")}
              className="bg-secondary/50 border-border/50 focus:border-primary/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCreate();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              {t("home.presetsLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {NAME_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="px-3 py-1.5 text-xs rounded-full bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                  onClick={() => setName(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="rounded-full"
          >
            {t("home.cancel")}
          </Button>
          <Button
            type="button"
            onClick={onCreate}
            disabled={isPending}
            className="cine-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? t("home.creating") : t("home.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
