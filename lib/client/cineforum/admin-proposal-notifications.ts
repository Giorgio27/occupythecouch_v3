import { jsonFetch } from "@/lib/client/https";

/**
 * Resend the "new proposal" Telegram message to the cineforum group.
 * Throws if Telegram is not configured, rejects the message, or the request fails.
 */
export async function resendProposalNotification(
  cineforumId: string,
  proposalId: string,
): Promise<void> {
  await jsonFetch(
    `/api/cineforum/${cineforumId}/admin/proposals/${proposalId}/notify`,
    { method: "POST", headers: { "Content-Type": "application/json" } },
  );
}
