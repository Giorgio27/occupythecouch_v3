// lib/client/cineforum/membership.ts
import { jsonFetch } from "../https";

export type MembershipDTO = {
  role: "OWNER" | "ADMIN" | "MEMBER";
  disabled: boolean;
  isAdmin: boolean;
};

export async function fetchCurrentMembership(
  cineforumId: string
): Promise<MembershipDTO> {
  return jsonFetch<MembershipDTO>(`/api/cineforum/${cineforumId}/membership`);
}
