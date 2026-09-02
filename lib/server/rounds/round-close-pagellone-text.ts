import { getRoundReport } from "@/lib/server/oscars/round-report";
import { escapeMarkdown } from "@/lib/server/external/telegram";
import oscarsIT from "@/locales/it/oscars.json";
import oscarsEN from "@/locales/en/oscars.json";

/** Emoji per award key — mirrors components/cineforum/oscars/RoundReport.tsx. */
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
 * Builds the "pagellone" (playful awards) section appended to the round-close
 * Telegram message, reusing the same award computation and copy shown in the
 * Oscars round report UI. Returns "" when the round earned no awards.
 */
export async function buildPagelloneSection(
  cineforumId: string,
  roundId: string,
  locale: string,
): Promise<string> {
  const awards = await getRoundReport(cineforumId, roundId);
  if (awards.length === 0) return "";

  const isEn = locale === "en";
  const dict = isEn ? oscarsEN.report : oscarsIT.report;
  const header = isEn ? "🏅 *Cycle report card:*" : "🏅 *Pagellone del ciclo:*";

  const lines = awards.map((a) => {
    const title =
      dict.awards[a.key as keyof typeof dict.awards] ?? a.key;
    const descTemplate = dict.desc[a.key as keyof typeof dict.desc] ?? "";
    const desc = escapeMarkdown(descTemplate.replace("{{v}}", a.value));
    const emoji = EMOJI[a.key] ?? "🏅";
    return `${emoji} *${title}*: ${escapeMarkdown(a.subject)} (${desc})`;
  });

  return `\n\n${header}\n${lines.join("\n")}`;
}
