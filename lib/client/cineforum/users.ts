// lib/client/cineforum/users.ts
import type { CineforumUsersListDTO, InviteUserDTO } from "@/lib/shared/types";
import { jsonFetch } from "../https";

export type InviteUserPayload = {
  email: string;
  name?: string;
  password: string;
  role: "ADMIN" | "MEMBER";
};

/**
 * Fetches the list of all members in a cineforum (admin only).
 *
 * @param cineforumId - The cineforum identifier
 * @returns Promise resolving to a CineforumUsersListDTO with all members
 */
export async function fetchCineforumUsers(
  cineforumId: string,
): Promise<CineforumUsersListDTO> {
  return jsonFetch<CineforumUsersListDTO>(
    `/api/cineforum/${cineforumId}/admin/users`,
  );
}

/**
 * Invites a new user to a cineforum by creating an account and membership.
 *
 * @param cineforumId - The cineforum identifier
 * @param payload - The invite payload including email, name, password, and role
 * @returns Promise resolving to an InviteUserDTO with the created user info
 */
export async function inviteUser(
  cineforumId: string,
  payload: InviteUserPayload,
): Promise<InviteUserDTO> {
  return jsonFetch<InviteUserDTO>(
    `/api/cineforum/${cineforumId}/admin/users/invite`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Updates the role of a cineforum member (admin only).
 *
 * @param cineforumId - The cineforum identifier
 * @param userId - The user identifier to update
 * @param role - The new role to assign ("ADMIN" or "MEMBER")
 * @returns Promise that resolves when the update is complete
 */
export async function updateUserRole(
  cineforumId: string,
  userId: string,
  role: "ADMIN" | "MEMBER",
): Promise<void> {
  await jsonFetch(`/api/cineforum/${cineforumId}/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

/**
 * Enables or disables a cineforum member's access (admin only).
 *
 * @param cineforumId - The cineforum identifier
 * @param userId - The user identifier to update
 * @param disabled - Whether to disable (true) or re-enable (false) the user
 * @returns Promise that resolves when the update is complete
 */
export async function toggleUserDisabled(
  cineforumId: string,
  userId: string,
  disabled: boolean,
): Promise<void> {
  await jsonFetch(`/api/cineforum/${cineforumId}/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ disabled }),
  });
}
