// lib/client/hooks/useAdminAccess.ts
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { fetchCurrentMembership } from "../cineforum/membership";

export function useAdminAccess(cineforumId: string | undefined) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      // Not authenticated - redirect to sign in
      if (sessionStatus === "unauthenticated") {
        router.push("/auth/signin");
        return;
      }

      // Still loading session
      if (sessionStatus === "loading" || !cineforumId) {
        return;
      }

      // Authenticated - check admin status
      try {
        const membership = await fetchCurrentMembership(cineforumId);

        if (!membership.isAdmin || membership.disabled) {
          // Not admin or disabled - redirect to cineforum home
          router.push(`/cineforum/${cineforumId}`);
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        // No membership or error - redirect to home
        router.push("/");
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [sessionStatus, cineforumId, router]);

  return {
    isAdmin,
    isLoading: sessionStatus === "loading" || isLoading,
    session,
  };
}
