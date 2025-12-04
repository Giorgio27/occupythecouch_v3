// lib/client/cineforum/users.ts
import type { CineforumUsersListDTO, InviteUserDTO } from "@/lib/shared/types";
import { jsonFetch } from "../https";

export type InviteUserPayload = {
  email: string;
  name?: string;
  password: string;
  role: "ADMIN" | "MEMBER";
};

export async function fetchCineforumUsers(
  cineforumId: string
): Promise<CineforumUsersListDTO> {
  return jsonFetch<CineforumUsersListDTO>(
    `/api/cineforum/${cineforumId}/admin/users`
  );
}

export async function inviteUser(
  cineforumId: string,
  payload: InviteUserPayload
): Promise<InviteUserDTO> {
  return jsonFetch<InviteUserDTO>(
    `/api/cineforum/${cineforumId}/admin/users/invite`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export async function updateUserRole(
  cineforumId: string,
  userId: string,
  role: "ADMIN" | "MEMBER"
): Promise<void> {
  await jsonFetch(`/api/cineforum/${cineforumId}/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export async function toggleUserDisabled(
  cineforumId: string,
  userId: string,
  disabled: boolean
): Promise<void> {
  await jsonFetch(`/api/cineforum/${cineforumId}/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ disabled }),
  });
}
