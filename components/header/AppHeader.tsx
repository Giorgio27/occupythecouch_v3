"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="w-full border-b border-border cine-glass sticky top-0 z-50 animate-fade-in-down">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
          <Image
            src="/couch-red.svg"
            alt="CineForum"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-black text-base sm:text-lg tracking-tight text-foreground hover:text-primary transition-colors duration-300">
            OccupySilvano
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          {session && (
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {session.user?.name || session.user?.email}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="cine-btn-ghost h-9 px-3 md:px-4 text-sm bg-transparent"
            onClick={() => signOut()}
          >
            Log out
          </Button>
        </div>
      </nav>
    </header>
  );
}
