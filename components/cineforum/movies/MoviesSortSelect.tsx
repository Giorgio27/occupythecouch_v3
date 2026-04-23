import { useTranslation } from "react-i18next";

type OrderCriteria = "proposals" | "wins" | "defeats";

type MoviesSortSelectProps = {
  value: OrderCriteria;
  onChange: (value: OrderCriteria) => void;
};

const OPTIONS: { criteria: OrderCriteria; labelKey: string }[] = [
  { criteria: "proposals", labelKey: "moviesList.sortProposals" },
  { criteria: "wins", labelKey: "moviesList.sortWins" },
  { criteria: "defeats", labelKey: "moviesList.sortDefeats" },
];

export default function MoviesSortSelect({
  value,
  onChange,
}: MoviesSortSelectProps) {
  const { t } = useTranslation("rankings");

  return (
    <div className="mb-6">
      <label
        htmlFor="orderCriteria"
        className="block text-sm font-medium mb-2 text-muted-foreground"
      >
        {t("moviesList.sortBy")}
      </label>
      <select
        id="orderCriteria"
        value={value}
        onChange={(e) => onChange(e.target.value as OrderCriteria)}
        className="w-full md:w-64 px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground"
      >
        {OPTIONS.map((option) => (
          <option key={option.criteria} value={option.criteria}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
