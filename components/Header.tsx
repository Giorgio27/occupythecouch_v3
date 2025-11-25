// components/Header.tsx
import * as React from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import PublicHeader from "@/components/header/PublicHeader";
import AppHeader from "@/components/header/AppHeader";
import CineforumHeaderNav from "@/components/header/CineforumHeaderNav";

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const cineforumId = router.query.cineforumId as string | undefined;
  const inCineforum = router.pathname.startsWith("/cineforum/[cineforumId]");

  // Loading state: per non far lampeggiare troppo la UI
  if (status === "loading") {
    return (
      <header className="w-full border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm text-muted-foreground">
          <span>CineFriends</span>
          <span>Checking session…</span>
        </div>
      </header>
    );
  }

  if (!session) {
    // Not authenticated
    return <PublicHeader />;
  }

  if (session && inCineforum && cineforumId) {
    // Authenticated inside a specific cineforum
    return <CineforumHeaderNav />;
  }

  // Authenticated, but not in a cineforum route
  return <AppHeader />;
}
