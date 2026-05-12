import { useTranslation } from "react-i18next";

export default function MoviesListTableHeader() {
  const { t } = useTranslation("rankings");

  return (
    <div className="cine-card-fit overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4 px-3 sm:px-6 bg-primary text-primary-foreground">
        {/* # — w-8 sm:w-16 */}
        <div className="w-8 sm:w-16 text-center font-bold text-sm sm:text-base shrink-0">
          #
        </div>
        {/* Title — flex-1 */}
        <div className="flex-1 font-bold text-sm sm:text-base">
          {t("moviesList.tableHeaderFilm")}
        </div>
        {/* Status — w-8 sm:w-28, centered */}
        <div className="w-8 sm:w-28 text-center font-bold text-sm sm:text-base shrink-0">
          <span className="hidden sm:inline">
            {t("moviesList.tableHeaderStatus")}
          </span>
          <span className="sm:hidden text-primary-foreground/60">·</span>
        </div>
        {/* Proposals — w-8 sm:w-20, text-right */}
        <div className="w-8 sm:w-20 text-right font-bold text-sm sm:text-base shrink-0">
          <span className="hidden sm:inline">
            {t("moviesList.tableHeaderProposals")}
          </span>
          <span className="sm:hidden">#</span>
        </div>
        {/* Chevron spacer — w-6 sm:w-10 */}
        <div className="w-6 sm:w-10 shrink-0" />
      </div>
    </div>
  );
}
