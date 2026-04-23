"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  User,
  Sun,
  Moon,
  Globe,
  LucideIcon,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/client/contexts/ThemeContext";

interface NavLink {
  id?: string;
  label: string;
  href: string;
  icon: LucideIcon;
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

type CineforumMobileMenuProps = {
  directLinks: NavLink[];
  rankingStatsLinks: NavLink[];
  videotecaLink: NavLink | null;
  adminLinks: NavLink[];
  pathname: string;
  hasCineNav: boolean;
  onClose: () => void;
  toggleLanguage: () => void;
};

export default function CineforumMobileMenu({
  directLinks,
  rankingStatsLinks,
  videotecaLink,
  adminLinks,
  pathname,
  hasCineNav,
  onClose,
  toggleLanguage,
}: CineforumMobileMenuProps) {
  const { data: session } = useSession();
  const { t } = useTranslation(["navigation", "common"]);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="lg:hidden border-t border-border bg-card/98 backdrop-blur-xl animate-fade-in">
      <div className="px-4 py-3 space-y-2">
        {hasCineNav && (
          <div className="space-y-1">
            {directLinks.map((link) => (
              <MobileDirectLink key={link.id} link={link} onClose={onClose} />
            ))}

            {rankingStatsLinks.length > 0 && (
              <MobileAccordion
                label={t("rankings.title")}
                icon={TrendingUp}
                links={rankingStatsLinks}
                pathname={pathname}
                value="ranking-stats"
                onClose={onClose}
              />
            )}

            {videotecaLink && (
              <MobileDirectLink link={videotecaLink} onClose={onClose} />
            )}

            {adminLinks.length > 0 && (
              <MobileAccordion
                label={t("admin.title")}
                icon={Settings}
                links={adminLinks}
                pathname={pathname}
                value="admin"
                onClose={onClose}
              />
            )}
          </div>
        )}

        {session && (
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground px-3">
                {session.user?.name || session.user?.email}
              </span>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-foreground hover:bg-accent/50 transition-colors"
                onClick={onClose}
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{t("menu.profile")}</span>
              </Link>

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
                  onClose();
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
  );
}
