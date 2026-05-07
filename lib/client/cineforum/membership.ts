// lib/client/cineforum/membership.ts
import { jsonFetch } from "../https";

export type MembershipDTO = {
  role: "OWNER" | "ADMIN" | "MEMBER";
  disabled: boolean;
  isAdmin: boolean;
};

/**
 * Fetches the current user's membership details for a cineforum.
 *
 * @param cineforumId - The cineforum identifier
 * @returns Promise resolving to a MembershipDTO with role and admin status
 */
export async function fetchCurrentMembership(
  cineforumId: string,
): Promise<MembershipDTO> {
  return jsonFetch<MembershipDTO>(`/api/cineforum/${cineforumId}/membership`);
}
