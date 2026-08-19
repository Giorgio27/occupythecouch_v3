import { useEffect, useState } from "react";
import { fetchUserRankings } from "@/lib/client/cineforum";
import type { UserRankingDTO } from "@/lib/shared/types";

/**
 * Loads the ranked user list for a cineforum and manages the currently
 * selected user, auto-selecting the first user once loaded. Shared by the
 * per-user stats pages so they don't each reimplement the same fetch.
 *
 * @param cineforumId - The cineforum to load users for
 */
export function useCineforumUserSelector(cineforumId: string) {
  const [users, setUsers] = useState<UserRankingDTO[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await fetchUserRankings(cineforumId, {
          offset: 0,
          limit: 100,
        });
        if (cancelled) return;
        setUsers(response.body);
        if (response.body.length > 0) {
          setSelectedUserId((prev) => prev ?? response.body[0].user_id);
        }
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [cineforumId]);

  return { users, selectedUserId, setSelectedUserId, loading };
}
