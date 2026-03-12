"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ChevronDown } from "lucide-react";

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cine-btn-ghost h-9 px-3 md:px-4 text-sm bg-transparent"
                >
                  <span className="hidden sm:inline">
                    {session.user?.name || session.user?.email}
                  </span>
                  <span className="sm:hidden">
                    <User className="h-4 w-4" />
                  </span>
                  <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.name || "Utente"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profilo</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </header>
  );
}
