// components/header/CineforumHeaderNav.tsx
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function CineforumHeaderNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // which desktop dropdown is open
  const [openMenu, setOpenMenu] = React.useState<
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

  // TODO: limit to admins when you have roles
  const adminLinks = hasCineNav
    ? [
        { label: "Rounds", href: `/cineforum/${cineforumId}/admin/rounds` },
        { label: "Teams", href: `/cineforum/${cineforumId}/admin/teams` },
        {
          label: "Proposals",
          href: `/cineforum/${cineforumId}/admin/proposals`,
        },
        {
          label: "Dashboard",
          href: `/cineforum/${cineforumId}/admin/dashboard`,
        },
      ]
    : [];

  return (
    <header className="w-full border-b bg-background">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand + desktop cine nav */}
        <div className="flex items-center gap-2">
          <Link href="/" className="font-semibold tracking-tight">
            CineFriends
          </Link>

          {hasCineNav && (
            <div className="ml-4 hidden items-center gap-4 md:flex">
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
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cinema
                </button>
                {cinemaLinks.length > 0 && openMenu === "cinema" && (
                  <div className="absolute left-0 top-full z-20 min-w-[160px] rounded-md border bg-popover p-1 text-sm shadow-sm">
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
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  History
                </button>
                {historyLinks.length > 0 && openMenu === "history" && (
                  <div className="absolute left-0 top-full z-20 min-w-[200px] rounded-md border bg-popover p-1 text-sm shadow-sm">
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
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Admin
                  </button>
                  {openMenu === "admin" && (
                    <div className="absolute left-0 top-full z-20 min-w-[200px] rounded-md border bg-popover p-1 text-sm shadow-sm">
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
        <div className="flex items-center gap-2">
          {/* Desktop auth */}
          <div className="hidden items-center gap-2 md:flex">
            {session && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user?.name || session.user?.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
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
            className="inline-flex items-center rounded-md border px-2 py-1 text-sm md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile dropdown panel (unchanged) */}
      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="mx-auto max-w-5xl space-y-4 px-4 py-3">
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
            <div className="border-t pt-3">
              {session ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">
                    {session.user?.name || session.user?.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                  >
                    Log out
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
