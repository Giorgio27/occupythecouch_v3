import { useEffect, useState } from "react";
import { fetchUserRadar } from "@/lib/client/cineforum";
import type { UserRadarResponseDTO } from "@/lib/shared/types";

/**
 * Loads the user-stats hexagons for every active member once per cineforum;
 * switching the selected user or the comparison doesn't refetch.
 *
 * @param cineforumId - The cineforum to load the radar for
 */
export function useUserRadar(cineforumId: string): {
  radar: UserRadarResponseDTO | null;
  loading: boolean;
} {
  const [radar, setRadar] = useState<UserRadarResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUserRadar(cineforumId)
      .then((response) => {
        if (!cancelled) setRadar(response);
      })
      .catch((error: unknown) => {
        console.error("Error loading user radar:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cineforumId]);

  return { radar, loading };
}
