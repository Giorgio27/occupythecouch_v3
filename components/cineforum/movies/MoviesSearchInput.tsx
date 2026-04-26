import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type MoviesSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function MoviesSearchInput({
  value,
  onChange,
}: MoviesSearchInputProps) {
  const { t } = useTranslation("rankings");

  return (
    <div className="relative flex-1 sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("moviesList.searchPlaceholder")}
        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-card text-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          hover:border-primary/50 transition-all duration-200 text-sm"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
