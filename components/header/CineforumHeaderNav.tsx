"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { fetchCurrentMembership } from "@/lib/client/cineforum/membership";

export default function CineforumHeaderNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // which desktop dropdown is open
  const [openMenu, setOpenMenu] = useState<
    "cinema" | "history" | "admin" | null
  >(null);

  const cineforumId = router.query.cineforumId as string;
  const hasCineNav = !!cineforumId;

  const cinemaLinks = hasCineNav
    ? [
        { label: "Proposals", href: `/cineforum/${cineforumId}` },
        { label: "Oscars", href: `/cineforum/${cineforumId}/oscars` },
      ]
    : [];

  const historyLinks = hasCineNav
    ? [
        {
          label: "Movies ranking",
          href: `/cineforum/${cineforumId}/movies-rankings`,
        },
        {
          label: "Users ranking",
          href: `/cineforum/${cineforumId}/users-rankings`,
        },
        { label: "World ranking", href: `/cineforum/${cineforumId}/world` },
        {
          label: "Directors ranking",
          href: `/cineforum/${cineforumId}/directors`,
        },
        { label: "Movies", href: `/cineforum/${cineforumId}/movies` },
      ]
    : [];

  // Check if user is admin
  useEffect(() => {
    if (!cineforumId || !session?.user) {
      setIsAdmin(false);
      return;
    }

    fetchCurrentMembership(cineforumId)
      .then((membership) => {
        setIsAdmin(membership.isAdmin && !membership.disabled);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [cineforumId, session]);

  const adminLinks =
    hasCineNav && isAdmin
      ? [
          { label: "Rounds", href: `/cineforum/${cineforumId}/admin/rounds` },
          { label: "Teams", href: `/cineforum/${cineforumId}/admin/teams` },
          {
            label: "Proposals",
            href: `/cineforum/${cineforumId}/admin/proposals`,
          },
          { label: "Users", href: `/cineforum/${cineforumId}/admin/users` },
        ]
      : [];

  return (
    <header className="w-full border-b border-border cine-glass sticky top-0 z-50 animate-fade-in-down">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Brand + desktop cine nav */}
        <div className="flex items-center gap-2 sm:gap-4">
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

          {hasCineNav && (
            <div className="hidden items-center gap-3 md:gap-4 md:flex">
              {/* Cinema dropdown (hover) */}
              <div
                className="relative"
                onMouseEnter={() => setOpenMenu("cinema")}
                onMouseLeave={() =>
                  setOpenMenu((prev) => (prev === "cinema" ? null : prev))
                }
              >
                <button
                  type="button"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Cinema
                </button>
                {cinemaLinks.length > 0 && openMenu === "cinema" && (
                  <div className="absolute left-0 top-full z-20 min-w-[160px] rounded-md border bg-popover p-1 text-sm shadow-lg animate-fade-in">
                    {cinemaLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded px-3 py-1.5 hover:bg-accent hover:text-accent-foreground"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* History dropdown (hover) */}
              <div
                className="relative"
                onMouseEnter={() => setOpenMenu("history")}
                onMouseLeave={() =>
                  setOpenMenu((prev) => (prev === "history" ? null : prev))
                }
              >
                <button
                  type="button"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  History
                </button>
                {historyLinks.length > 0 && openMenu === "history" && (
                  <div className="absolute left-0 top-full z-20 min-w-[200px] rounded-md border bg-popover p-1 text-sm shadow-lg animate-fade-in">
                    {historyLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded px-3 py-1.5 hover:bg-accent hover:text-accent-foreground"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin dropdown (hover) */}
              {adminLinks.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setOpenMenu("admin")}
                  onMouseLeave={() =>
                    setOpenMenu((prev) => (prev === "admin" ? null : prev))
                  }
                >
                  <button
                    type="button"
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    Admin
                  </button>
                  {openMenu === "admin" && (
                    <div className="absolute left-0 top-full z-20 min-w-[200px] rounded-md border bg-popover p-1 text-sm shadow-lg animate-fade-in">
                      {adminLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block rounded px-3 py-1.5 hover:bg-accent hover:text-accent-foreground"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: auth + mobile toggle */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Desktop auth */}
          <div className="hidden items-center gap-2 md:flex">
            {session && (
              <span className="hidden text-sm text-muted-foreground lg:inline">
                {session.user?.name || session.user?.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="cine-btn-ghost h-9 px-3 md:px-4 text-sm bg-transparent"
              onClick={() => {
                setOpenMenu(null);
                signOut();
              }}
            >
              Log out
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 -mr-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Chiudi menu" : "Apri menu"}
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-4 space-y-4">
            {hasCineNav && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Cinema
                  </p>
                  <div className="mt-1 flex flex-col gap-1">
                    {cinemaLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm text-foreground hover:underline"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    History
                  </p>
                  <div className="mt-1 flex flex-col gap-1">
                    {historyLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm text-foreground hover:underline"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {adminLinks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Admin
                    </p>
                    <div className="mt-1 flex flex-col gap-1">
                      {adminLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-sm text-foreground hover:underline"
                          onClick={() => setMobileOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile auth */}
            {session && (
              <div className="border-t border-border pt-4">
                <div className="flex flex-col gap-3">
                  <span className="text-sm text-muted-foreground">
                    {session.user?.name || session.user?.email}
                  </span>
                  <Button
                    variant="outline"
                    className="w-full cine-btn-ghost h-11 text-base bg-transparent"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                  >
                    Log out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
