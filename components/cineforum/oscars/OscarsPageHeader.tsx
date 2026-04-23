import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

type OscarsPageHeaderProps = {
  cineforumName: string;
};

export default function OscarsPageHeader({
  cineforumName,
}: OscarsPageHeaderProps) {
  const { t } = useTranslation("oscars");

  return (
    <div className="mb-8 animate-fade-in-down">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-linear-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
          <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Oscars
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
            {cineforumName}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl">{t("subtitle")}</p>
    </div>
  );
}
