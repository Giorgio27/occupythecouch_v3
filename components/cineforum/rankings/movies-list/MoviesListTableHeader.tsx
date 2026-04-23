import { useTranslation } from "react-i18next";

export default function MoviesListTableHeader() {
  const { t } = useTranslation("rankings");

  return (
    <div className="cine-card-fit overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6 bg-primary text-primary-foreground">
        <div className="w-12 sm:w-16 text-center font-bold text-sm sm:text-base">
          #
        </div>
        <div className="flex-1 font-bold text-sm sm:text-base">
          {t("moviesList.tableHeaderFilm")}
        </div>
        <div className="w-24 sm:w-32 text-right font-bold text-sm sm:text-base">
          {t("moviesList.tableHeaderWins")}
        </div>
      </div>
    </div>
  );
}
