"use client";

import Link from "next/link";
import Image from "next/image";
import UserProfileMenu from "./UserProfileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AppHeader() {
  return (
    <header className="w-full border-b border-border cine-glass sticky top-0 z-50 animate-fade-in-down">
      <nav className="mx-auto flex max-w-site items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 group"
          title="Home"
        >
          <Image
            src="/couch-red.svg"
            alt="Home"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-black text-base sm:text-lg tracking-tight text-foreground hover:text-primary transition-colors duration-300">
            Occupy the Couch
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />
          <UserProfileMenu />
        </div>
      </nav>
    </header>
  );
}
