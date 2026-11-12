import prisma from "@/lib/prisma";
import { absoluteAppUrl } from "@/lib/server/app-url";
import { escapeMarkdown, telegramNotify } from "@/lib/server/external";

/** Outcome of a "new proposal" Telegram notification. */
export type ProposalNotificationResult = "sent" | "not_configured" | "failed";

interface ProposalCreatedTextParams {
  ownerName: string;
  title: string;
  description: string;
  date: Date | null;
  locale: string;
  proposalUrl: string | null;
}

/**
 * Builds the "new proposal" Telegram message. User-typed text is escaped:
 * an unbalanced Markdown character would make Telegram reject the message.
 *
 * @param params - Proposal fields and cineforum locale
 */
export function buildProposalCreatedText(
  params: ProposalCreatedTextParams,
): string {
  const isEn = params.locale === "en";
  const owner = escapeMarkdown(params.ownerName);
  const body = `${escapeMarkdown(params.title)}\n\n${escapeMarkdown(params.description)}`;
  const date = params.date?.toLocaleDateString(isEn ? "en-GB" : "it-IT") ?? "";
  const link = params.proposalUrl
    ? `\n\n${isEn ? "Vote here" : "Vota qui"}: ${params.proposalUrl}`
    : "";

  return isEn
    ? `Hello everyone!\nThe proposal for ${date} is:\n\nBy ${owner}\n${body}${link}`
    : `Ciao a tutti!\nLa proposta per il ${date} è:\n\nDi ${owner}\n${body}${link}`;
}

/**
 * Sends the "new proposal" Telegram message for a proposal of a cineforum.
 * Used right after creation and by the admin "resend" action.
 *
 * @param cineforumId - Cineforum the proposal must belong to
 * @param proposalId - Proposal to announce
 * @throws Error with code `PROPOSAL_NOT_FOUND` when the proposal is not in the cineforum
 */
export async function notifyProposalCreated(
  cineforumId: string,
  proposalId: string,
): Promise<ProposalNotificationResult> {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, cineforumId },
    select: {
      title: true,
      description: true,
      date: true,
      ownerUser: { select: { name: true } },
      ownerTeam: { select: { name: true } },
      cineforum: {
        select: { telegramBotToken: true, telegramChatId: true, locale: true },
      },
    },
  });
  if (!proposal) {
    throw Object.assign(new Error("Proposal not found"), {
      code: "PROPOSAL_NOT_FOUND",
    });
  }

  const { telegramBotToken, telegramChatId, locale } = proposal.cineforum;
  if (!telegramBotToken || !telegramChatId) return "not_configured";

  const text = buildProposalCreatedText({
    ownerName: proposal.ownerUser?.name ?? proposal.ownerTeam?.name ?? "",
    title: proposal.title,
    description: proposal.description ?? "",
    date: proposal.date,
    locale,
    proposalUrl: absoluteAppUrl(`/cineforum/${cineforumId}/proposal`),
  });

  const sent = await telegramNotify(text, telegramBotToken, telegramChatId);
  console.info(`[notifyProposalCreated] proposal ${proposalId}: sent=${sent}`);
  return sent ? "sent" : "failed";
}
