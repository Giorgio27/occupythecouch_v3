"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import PublicHeader from "@/components/header/PublicHeader";
import AppHeader from "@/components/header/AppHeader";
import CineforumHeaderNav from "@/components/header/CineforumHeaderNav";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const cineforumId = pathname?.split("/cineforum/")[1]?.split("/")[0];
  const inCineforum = pathname?.includes("/cineforum/");

  if (status === "loading") {
    return (
      <header className="w-full border-b border-border bg-gradient-to-r from-cine-bg via-cine-bg-soft to-cine-bg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-sm text-muted-foreground">
          <span className="font-black text-foreground">OccupySilvano</span>
          <span>Checking session…</span>
        </div>
      </header>
    );
  }

  if (!session) {
    return <PublicHeader />;
  }

  if (session && inCineforum && cineforumId) {
    return <CineforumHeaderNav />;
  }

  return <AppHeader />;
}
