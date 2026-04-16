"use client";

import Link from "next/link";
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
import { User, LogOut, ChevronDown, Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "@/lib/client/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export default function UserProfileMenu() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation(["common", "navigation"]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "it" ? "en" : "it";
    i18n.changeLanguage(newLang);
  };

  if (!session) {
    return null;
  }

  return (
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
              {session.user?.name || t("common:userMenu.defaultUser")}
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
            <span>{t("navigation:header.profile")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
        >
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t("common:userMenu.lightTheme")}</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("common:userMenu.darkTheme")}</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            toggleLanguage();
          }}
        >
          <Globe className="mr-2 h-4 w-4" />
          <span>
            {t("common:userMenu.language")}:{" "}
            {t("common:languageSwitcher.current")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          variant="destructive"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("navigation:header.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
