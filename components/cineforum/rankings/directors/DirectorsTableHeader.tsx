import { useTranslation } from "react-i18next";

export default function DirectorsTableHeader() {
  const { t } = useTranslation("rankings");

  return (
    <div className="cine-card-fit overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6 bg-primary text-primary-foreground">
        <div className="w-12 sm:w-16 text-center font-bold text-sm sm:text-base">
          #
        </div>
        <div className="flex-1 font-bold text-sm sm:text-base">
          {t("directors.tableHeaderDirectors")}
        </div>
        <div className="w-16 sm:w-20 text-center font-bold text-sm sm:text-base">
          {t("directors.tableHeaderCount")}
        </div>
        <div className="w-20 sm:w-24 text-right font-bold text-sm sm:text-base">
          {t("directors.tableHeaderRating")}
        </div>
        <div className="w-8 sm:w-10" />
      </div>
    </div>
  );
}
