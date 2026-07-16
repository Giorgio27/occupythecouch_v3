import { useEffect, useState } from "react";
import { ClipboardList, Loader2, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { jsonFetch } from "@/lib/client/https";
import type { RoundAwardDTO, RoundReportDTO } from "@/lib/shared/types/cineforum";

interface RoundReportProps {
  cineforumId: string;
  roundId: string;
}

/** Emoji per award key (labels/descriptions live in i18n). */
const EMOJI: Record<string, string> = {
  generoso: "🎁",
  boia: "🔪",
  metronomo: "🎯",
  contrario: "🌶️",
  fantasma: "👻",
  minaVagante: "💣",
  spaccaCineforum: "⚔️",
  tesoro: "💎",
  sopravvalutato: "🥊",
  consensuale: "🤝",
};

/**
 * "Pagellone" for a closed oscar round — playful awards for members and films,
 * fetched lazily (a teaser click) so a long list of rounds fires no requests
 * up front. Only awards the server actually assigned are shown.
 */
export default function RoundReport({ cineforumId, roundId }: RoundReportProps) {
  const { t } = useTranslation("oscars");
  const [armed, setArmed] = useState(false);
  const [data, setData] = useState<RoundAwardDTO[] | null>(null);

  useEffect(() => {
    if (!armed) return;
    let alive = true;
    jsonFetch<RoundReportDTO>(
      `/api/cineforum/${cineforumId}/oscars/round-report?roundId=${roundId}`,
    )
      .then((res) => alive && setData(res.body))
      .catch(() => alive && setData([]));
    return () => {
      alive = false;
    };
  }, [armed, cineforumId, roundId]);

  const wrap = (child: React.ReactNode) => (
    <div className="mt-3 border-t border-border/40 pt-3">{child}</div>
  );

  if (!armed) {
    return wrap(
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400"
      >
        <ClipboardList className="h-4 w-4" />
        {t("report.teaser")}
        <ChevronDown className="ml-auto h-4 w-4" />
      </button>,
    );
  }

  if (data === null) {
    return wrap(
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>,
    );
  }

  const members = data.filter((a) => a.kind === "member");
  const films = data.filter((a) => a.kind === "film");

  const Award = ({ a }: { a: RoundAwardDTO }) => (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <span className="text-lg leading-none">{EMOJI[a.key] ?? "🏅"}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground">
          {t(`report.awards.${a.key}`)}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">
          {a.subject}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {t(`report.desc.${a.key}`, { v: a.value })}
        </p>
      </div>
    </div>
  );

  return wrap(
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
        <ClipboardList className="h-3.5 w-3.5" />
        {t("report.title")}
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("report.empty")}</p>
      ) : (
        <div className="space-y-4">
          {members.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("report.membersTitle")}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {members.map((a) => (
                  <Award key={a.key + a.subject} a={a} />
                ))}
              </div>
            </div>
          )}
          {films.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("report.filmsTitle")}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {films.map((a) => (
                  <Award key={a.key + a.subject} a={a} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>,
  );
}
