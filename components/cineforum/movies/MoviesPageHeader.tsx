import { Film } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MoviesPageHeader() {
  const { t } = useTranslation("rankings");

  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-primary/10">
          <Film className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          {t("moviesList.pageTitle")}
        </h1>
      </div>
      <p className="text-muted-foreground text-sm sm:text-base mt-2">
        {t("moviesList.pageSubtitle")}
      </p>
    </div>
  );
}
