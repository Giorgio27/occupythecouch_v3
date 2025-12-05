// lib/shared/types/users.ts

export type CineforumUserDTO = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  membershipId: string;
  isOwner: boolean;
  disabled: boolean;
  joinedAt: string;
};

export type CineforumUsersListDTO = {
  users: CineforumUserDTO[];
};

export type InviteUserDTO = {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
};
