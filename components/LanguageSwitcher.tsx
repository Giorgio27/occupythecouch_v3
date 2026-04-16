import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("common");

  const toggleLanguage = () => {
    const newLang = i18n.language === "it" ? "en" : "it";
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
