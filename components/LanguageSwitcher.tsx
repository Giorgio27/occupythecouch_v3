import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("common");

  const toggleLanguage = () => {
    const newLang = i18n.language === "it" ? "en" : "it";
    // Persist in both localStorage (client-side detection) and a cookie
    // (server-side detection for SSR hydration consistency).
    document.cookie = `i18nextLng=${newLang};path=/;max-age=31536000;SameSite=Lax`;
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
      title={t("languageSwitcher.tooltip")}
    >
      <Globe className="h-4 w-4" />
      <span className="font-semibold">{t("languageSwitcher.current")}</span>
    </Button>
  );
}
