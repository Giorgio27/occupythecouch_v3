import { useState } from "react";
import { Clapperboard, Loader2, ChevronDown, RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RoundCriticProps {
  cineforumId: string;
  roundId: string;
}

type State = "idle" | "loading" | "done" | "error";

/**
 * "Il Critico" — a snarky-but-honest film critic (via a swappable free LLM,
 * server-side) riffing on how the club voted this cycle. Lazy: the request only
 * fires when the user asks, so listing rounds costs nothing.
 */
export default function RoundCritic({ cineforumId, roundId }: RoundCriticProps) {
  const { t } = useTranslation("oscars");
  const [state, setState] = useState<State>("idle");
  const [text, setText] = useState("");

  const ask = async () => {
    setState("loading");
    try {
      const res = await fetch(
        `/api/cineforum/${cineforumId}/oscars/critic?roundId=${roundId}`,
      );
      const data = await res.json();
      if (!res.ok || !data.text) throw new Error("no text");
      setText(data.text);
      setState("done");
    } catch {
      setState("error");
    }
  };

  const wrap = (child: React.ReactNode) => (
    <div className="mt-3 border-t border-border/40 pt-3">{child}</div>
  );

  if (state === "idle") {
    return wrap(
      <button
        type="button"
        onClick={ask}
        className="flex w-full items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
      >
        <Clapperboard className="h-4 w-4" />
        {t("critic.teaser")}
        <ChevronDown className="ml-auto h-4 w-4" />
      </button>,
    );
  }

  if (state === "loading") {
    return wrap(
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("critic.loading")}
      </div>,
    );
  }

  if (state === "error") {
    return wrap(
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <span>{t("critic.error")}</span>
        <button
          type="button"
          onClick={ask}
          className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary"
        >
          <RotateCw className="h-3.5 w-3.5" />
          {t("critic.retry")}
        </button>
      </div>,
    );
  }

  return wrap(
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
        <Clapperboard className="h-3.5 w-3.5" />
        {t("critic.title")}
      </div>
      <p className="whitespace-pre-line text-sm italic leading-relaxed text-foreground">
        {text}
      </p>
    </div>,
  );
}
