"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  User,
  FileText,
  Award,
  TrendingUp,
  Film,
  Settings,
  ChevronDown,
  Calendar,
  Users,
  Earth,
  LucideIcon,
  Sun,
  Moon,
  Globe,
  CalendarDays,
  History,
} from "lucide-react";
import { fetchCurrentMembership } from "@/lib/client/cineforum/membership";
import { useCineforum } from "@/lib/client/contexts/CineforumContext";
import { useTheme } from "@/lib/client/contexts/ThemeContext";
import UserProfileMenu from "./UserProfileMenu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

// Types
interface NavLink {
  id?: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

// Helper Components
function DirectNavLink({
  link,
  pathname,
}: {
  link: NavLink;
  pathname: string;
}) {
  const Icon = link.icon;
  const isActive = pathname === link.href;

  return (
    <Link
      href={link.href}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "text-primary bg-accent/50"
          : "hover:text-primary hover:bg-accent/50"
      }`}
    >
      <Icon
        className={`h-4 w-4 transition-transform ${isActive ? "text-primary" : "text-primary/70 group-hover:text-primary"} group-hover:scale-110`}
      />
      <span>{link.label}</span>
    </Link>
  );
}

function DropdownMenuItem({
  link,
  pathname,
}: {
  link: NavLink;
  pathname: string;
}) {
  const Icon = link.icon;
  const isActive = pathname === link.href;

  return (
    <Link
      href={link.href}
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-200 ${
        isActive
          ? "bg-primary/15 text-primary"
          : "hover:bg-accent/80 text-foreground"
      }`}
    >
      <Icon
        className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
          isActive ? "text-primary" : "text-primary/70 group-hover:text-primary"
        }`}
      />
      <span className="text-sm font-medium">{link.label}</span>
    </Link>
  );
}

function DesktopDropdown({
  label,
  icon: Icon,
  links,
  pathname,
  isOpen,
  onMouseEnter,
  onMouseLeave,
}: {
  label: string;
  icon: LucideIcon;
  links: NavLink[];
  pathname: string;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:text-primary hover:bg-accent/50 transition-all duration-200"
      >
        <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary group-hover:scale-110 transition-all" />
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-full pt-2 z-20"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="w-72 rounded-xl border border-border/50 bg-gradient-to-b from-popover/98 to-popover/95 backdrop-blur-xl p-3 shadow-2xl animate-fade-in">
            <div className="space-y-1">
              {links.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  link={link}
                  pathname={pathname}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileDirectLink({
  link,
  onClose,
}: {
  link: NavLink;
  onClose: () => void;
}) {
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-accent/50 hover:text-primary transition-all duration-200 active:scale-[0.98]"
      onClick={onClose}
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="font-medium">{link.label}</span>
    </Link>
  );
}

function MobileAccordionLink({
  link,
  pathname,
  onClose,
}: {
  link: NavLink;
  pathname: string;
  onClose: () => void;
}) {
  const Icon = link.icon;
  const isActive = pathname === link.href;

  return (
    <Link
      href={link.href}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
        isActive
          ? "text-primary bg-accent/50 font-medium"
          : "hover:text-foreground hover:bg-accent/30"
      }`}
      onClick={onClose}
    >
      <Icon
        className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-primary/70"}`}
      />
      <span>{link.label}</span>
    </Link>
  );
}

function MobileAccordion({
  label,
  icon: Icon,
  links,
  pathname,
  value,
  onClose,
}: {
  label: string;
  icon: LucideIcon;
  links: NavLink[];
  pathname: string;
  value: string;
  onClose: () => void;
}) {
  return (
    <Accordion type="single" collapsible className="border-none">
      <AccordionItem value={value} className="border-none">
        <AccordionTrigger className="py-3 px-3 hover:no-underline hover:bg-accent/50 rounded-md transition-colors [&[data-state=open]]:bg-accent/30">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">{label}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-1 pt-1">
          <div className="pl-11 space-y-1">
            {links.map((link) => (
              <MobileAccordionLink
                key={link.href}
                link={link}
                pathname={pathname}
                onClose={onClose}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function CineforumHeaderNav() {
  const { cineforumId, cineforumName } = useCineforum();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { t, i18n } = useTranslation(["navigation", "common"]);
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === "it" ? "en" : "it";
    i18n.changeLanguage(newLang);
  };

  // which desktop dropdown is open
  const [openMenu, setOpenMenu] = useState<"ranking-stats" | "admin" | null>(
    null,
  );

  const hasCineNav = !!cineforumId;

  // Direct navigation links (no dropdown)
  const directLinks = hasCineNav
    ? [
        {
          id: "proposte",
          label: t("menu.proposals"),
          href: `/cineforum/${cineforumId}/proposal`,
          icon: FileText,
        },
        {
          id: "oscar",
          label: t("menu.oscars"),
          href: `/cineforum/${cineforumId}/oscars`,
          icon: Award,
        },
      ]
    : [];

  // Ranking & Stats dropdown links with icons
  const rankingStatsLinks = hasCineNav
    ? [
        {
          label: t("rankings.movies"),
          href: `/cineforum/${cineforumId}/rankings/movies`,
          icon: Film,
          description: t("rankings.moviesDesc"),
        },
        {
          label: t("rankings.users"),
          href: `/cineforum/${cineforumId}/rankings/users`,
          icon: TrendingUp,
          description: t("rankings.usersDesc"),
        },
        {
          label: t("rankings.userStats"),
          href: `/cineforum/${cineforumId}/stats/users`,
          icon: Award,
          description: t("rankings.userStatsDesc"),
        },
        {
          label: t("rankings.directors"),
          href: `/cineforum/${cineforumId}/rankings/directors`,
          icon: User,
          description: t("rankings.directorsDesc"),
        },
        {
          label: t("rankings.countries"),
          href: `/cineforum/${cineforumId}/rankings/countries`,
          icon: Earth,
          description: t("rankings.countriesDesc"),
        },
        {
          label: t("rankings.timeline"),
          href: `/cineforum/${cineforumId}/rankings/timeline`,
          icon: CalendarDays,
          description: t("rankings.timelineDesc"),
        },
        {
          label: t("rankings.proposals"),
          href: `/cineforum/${cineforumId}/rankings/proposals`,
          icon: History,
          description: t("rankings.proposalsDesc"),
        },
      ]
    : [];

  // Videoteca as separate direct link
  const videotecaLink = hasCineNav
    ? {
        id: "videoteca",
        label: t("menu.videoteca"),
        href: `/cineforum/${cineforumId}/movies`,
        icon: Film,
      }
    : null;

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
          {
            label: t("admin.rounds"),
            href: `/cineforum/${cineforumId}/admin/rounds`,
            icon: Calendar,
            description: t("admin.roundsDesc"),
          },
          {
            label: t("admin.teams"),
            href: `/cineforum/${cineforumId}/admin/teams`,
            icon: Users,
            description: t("admin.teamsDesc"),
          },
          {
            label: t("admin.proposals"),
            href: `/cineforum/${cineforumId}/admin/proposals`,
            icon: FileText,
            description: t("admin.proposalsDesc"),
          },
          {
            label: t("admin.users"),
            href: `/cineforum/${cineforumId}/admin/users`,
            icon: User,
            description: t("admin.usersDesc"),
          },
        ]
      : [];

  return (
    <header className="w-full border-b border-border cine-glass sticky top-0 z-50 animate-fade-in-down">
      <nav className="mx-auto flex max-w-site items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Brand + desktop cine nav */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logo → Home generale */}
          <Link
            href="/"
            className="flex items-center group"
            title={t("menu.backToHome")}
          >
            <Image
              src="/couch-red.svg"
              alt="Home"
              width={32}
              height={32}
              className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110"
            />
          </Link>

          {/* Nome Cineforum → Home del cineforum (con ellipsis per nomi lunghi) */}
          {cineforumName && cineforumId && (
            <>
              <span className="text-muted-foreground/50 hidden sm:inline shrink-0">
                •
              </span>
              <Link
                href={`/cineforum/${cineforumId}`}
                className="font-black text-base sm:text-lg tracking-tight text-foreground hover:text-primary transition-colors duration-300 truncate max-w-50 sm:max-w-62.5 lg:max-w-75"
                title={cineforumName}
              >
                {cineforumName}
              </Link>
            </>
          )}

          {hasCineNav && (
            <div className="hidden items-center gap-1 lg:flex">
              {/* Direct links: Proposte, Oscar */}
              {directLinks.map((link) => (
                <DirectNavLink key={link.id} link={link} pathname={pathname} />
              ))}

              {/* Ranking & Stats dropdown (hover) */}
              {rankingStatsLinks.length > 0 && (
                <DesktopDropdown
                  label={t("rankings.title")}
                  icon={TrendingUp}
                  links={rankingStatsLinks}
                  pathname={pathname}
                  isOpen={openMenu === "ranking-stats"}
                  onMouseEnter={() => setOpenMenu("ranking-stats")}
                  onMouseLeave={() =>
                    setOpenMenu((prev) =>
                      prev === "ranking-stats" ? null : prev,
                    )
                  }
                />
              )}

              {/* Videoteca direct link */}
              {videotecaLink && (
                <DirectNavLink link={videotecaLink} pathname={pathname} />
              )}

              {/* Admin dropdown (hover) */}
              {adminLinks.length > 0 && (
                <DesktopDropdown
                  label={t("admin.title")}
                  icon={Settings}
                  links={adminLinks}
                  pathname={pathname}
                  isOpen={openMenu === "admin"}
                  onMouseEnter={() => setOpenMenu("admin")}
                  onMouseLeave={() =>
                    setOpenMenu((prev) => (prev === "admin" ? null : prev))
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* Right side: auth + mobile toggle */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Desktop auth */}
          <div className="hidden items-center gap-2 lg:flex">
            <UserProfileMenu />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 -mr-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? t("menu.closeMenu") : t("menu.openMenu")}
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
        <div className="lg:hidden border-t border-border bg-card/98 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-3 space-y-2">
            {hasCineNav && (
              <div className="space-y-1">
                {/* Direct links with icons */}
                {directLinks.map((link) => (
                  <MobileDirectLink
                    key={link.id}
                    link={link}
                    onClose={() => setMobileOpen(false)}
                  />
                ))}

                {/* Ranking & Stats accordion */}
                {rankingStatsLinks.length > 0 && (
                  <MobileAccordion
                    label={t("rankings.title")}
                    icon={TrendingUp}
                    links={rankingStatsLinks}
                    pathname={pathname}
                    value="ranking-stats"
                    onClose={() => setMobileOpen(false)}
                  />
                )}

                {/* Videoteca direct link */}
                {videotecaLink && (
                  <MobileDirectLink
                    link={videotecaLink}
                    onClose={() => setMobileOpen(false)}
                  />
                )}

                {/* Admin accordion */}
                {adminLinks.length > 0 && (
                  <MobileAccordion
                    label={t("admin.title")}
                    icon={Settings}
                    links={adminLinks}
                    pathname={pathname}
                    value="admin"
                    onClose={() => setMobileOpen(false)}
                  />
                )}
              </div>
            )}

            {/* Mobile auth */}
            {session && (
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground px-3">
                    {session.user?.name || session.user?.email}
                  </span>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-foreground hover:bg-accent/50 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {t("menu.profile")}
                    </span>
                  </Link>

                  {/* Theme switcher */}
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-foreground hover:bg-accent/50 transition-colors w-full text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleTheme();
                    }}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t("common:userMenu.lightTheme")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t("common:userMenu.darkTheme")}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Language switcher */}
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-foreground hover:bg-accent/50 transition-colors w-full text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleLanguage();
                    }}
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {t("common:userMenu.language")}:{" "}
                      {t("common:languageSwitcher.current")}
                    </span>
                  </button>

                  <Button
                    variant="outline"
                    className="w-full cine-btn-ghost h-10 text-sm bg-transparent mx-0"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                  >
                    {t("header.logout")}
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
