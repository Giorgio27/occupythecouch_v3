"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  CalendarDays,
  History,
  Bell,
  BarChart2,
} from "lucide-react";
import { fetchCurrentMembership } from "@/lib/client/cineforum/membership";
import { useCineforum } from "@/lib/client/contexts/CineforumContext";
import UserProfileMenu from "./UserProfileMenu";
import CineforumMobileMenu from "./CineforumMobileMenu";
import { useTranslation } from "react-i18next";

interface NavLink {
  id?: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

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

function DropdownNavItem({
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
        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-primary/70 group-hover:text-primary"}`}
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
          <div className="w-72 rounded-xl border border-border/50 bg-linear-to-b from-popover/98 to-popover/95 backdrop-blur-xl p-3 shadow-2xl animate-fade-in">
            <div className="space-y-1">
              {links.map((link) => (
                <DropdownNavItem
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

export default function CineforumHeaderNav() {
  const { cineforumId, cineforumName } = useCineforum();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { t, i18n } = useTranslation(["navigation", "common"]);
  const [openMenu, setOpenMenu] = useState<"ranking-stats" | "admin" | null>(
    null,
  );

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "it" ? "en" : "it");
  };

  const hasCineNav = !!cineforumId;

  const directLinks: NavLink[] = hasCineNav
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

  const rankingStatsLinks: NavLink[] = hasCineNav
    ? [
        {
          label: t("rankings.movies"),
          href: `/cineforum/${cineforumId}/rankings/movies`,
          icon: Film,
        },
        {
          label: t("rankings.users"),
          href: `/cineforum/${cineforumId}/rankings/users`,
          icon: TrendingUp,
        },
        {
          label: t("rankings.userStats"),
          href: `/cineforum/${cineforumId}/stats/users`,
          icon: Award,
        },
        {
          label: t("rankings.directors"),
          href: `/cineforum/${cineforumId}/rankings/directors`,
          icon: User,
        },
        {
          label: t("rankings.countries"),
          href: `/cineforum/${cineforumId}/rankings/countries`,
          icon: Earth,
        },
        {
          label: t("rankings.timeline"),
          href: `/cineforum/${cineforumId}/rankings/timeline`,
          icon: CalendarDays,
        },
        {
          label: t("rankings.proposals"),
          href: `/cineforum/${cineforumId}/rankings/proposals`,
          icon: History,
        },
        {
          label: t("rankings.proposalStats"),
          href: `/cineforum/${cineforumId}/rankings/proposals-stats`,
          icon: BarChart2,
        },
      ]
    : [];

  const videotecaLink: NavLink | null = hasCineNav
    ? {
        id: "videoteca",
        label: t("menu.videoteca"),
        href: `/cineforum/${cineforumId}/movies`,
        icon: Film,
      }
    : null;

  useEffect(() => {
    if (!cineforumId || !session?.user) {
      setIsAdmin(false);
      return;
    }
    fetchCurrentMembership(cineforumId)
      .then((membership) =>
        setIsAdmin(membership.isAdmin && !membership.disabled),
      )
      .catch(() => setIsAdmin(false));
  }, [cineforumId, session]);

  const adminLinks: NavLink[] =
    hasCineNav && isAdmin
      ? [
          {
            label: t("admin.rounds"),
            href: `/cineforum/${cineforumId}/admin/rounds`,
            icon: Calendar,
          },
          {
            label: t("admin.teams"),
            href: `/cineforum/${cineforumId}/admin/teams`,
            icon: Users,
          },
          {
            label: t("admin.proposals"),
            href: `/cineforum/${cineforumId}/admin/proposals`,
            icon: FileText,
          },
          {
            label: t("admin.users"),
            href: `/cineforum/${cineforumId}/admin/users`,
            icon: User,
          },
          {
            label: t("admin.notifications"),
            href: `/cineforum/${cineforumId}/admin/notifications`,
            icon: Bell,
          },
        ]
      : [];

  return (
    <header className="w-full border-b border-border cine-glass sticky top-0 z-50 animate-fade-in-down">
      <nav className="mx-auto flex max-w-site items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4">
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
              {directLinks.map((link) => (
                <DirectNavLink key={link.id} link={link} pathname={pathname} />
              ))}

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

              {videotecaLink && (
                <DirectNavLink link={videotecaLink} pathname={pathname} />
              )}

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

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden items-center gap-2 lg:flex">
            <UserProfileMenu />
          </div>

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

      {mobileOpen && (
        <CineforumMobileMenu
          directLinks={directLinks}
          rankingStatsLinks={rankingStatsLinks}
          videotecaLink={videotecaLink}
          adminLinks={adminLinks}
          pathname={pathname}
          hasCineNav={hasCineNav}
          onClose={() => setMobileOpen(false)}
          toggleLanguage={toggleLanguage}
        />
      )}
    </header>
  );
}
