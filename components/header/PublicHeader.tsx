"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-border cine-glass sticky top-0 z-50 animate-fade-in-down">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
          <Image
            src="/couch-red.svg"
            alt="CineForum"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-black text-base sm:text-lg tracking-tight text-foreground hover:text-primary transition-colors duration-300">
            CineForum
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-2 md:gap-3">
          <Link href="/auth/signin">
            <Button
              variant="outline"
              size="sm"
              className="cine-btn-ghost h-9 px-3 md:px-4 text-sm bg-transparent"
            >
              Log in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="cine-btn h-9 px-3 md:px-4 text-sm">
              Sign up
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="sm:hidden p-2 -mr-2 text-foreground hover:text-primary transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-border bg-card/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/auth/signin"
              className="block"
              onClick={() => setIsMenuOpen(false)}
            >
              <Button
                variant="outline"
                className="w-full cine-btn-ghost h-11 text-base bg-transparent"
              >
                Log in
              </Button>
            </Link>
            <Link
              href="/auth/signup"
              className="block"
              onClick={() => setIsMenuOpen(false)}
            >
              <Button className="w-full cine-btn h-11 text-base">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
