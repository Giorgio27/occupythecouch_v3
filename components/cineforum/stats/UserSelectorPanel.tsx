import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRankingDTO } from "@/lib/shared/types";
import i18n from "@/lib/i18n";

type Props = {
  users: UserRankingDTO[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
};

/** User dropdown + join-date panel shared across the per-user stats pages. */
export default function UserSelectorPanel({
  users,
  selectedUserId,
  onSelect,
}: Props) {
  const { t } = useTranslation("stats");
  const selected = users.find((u) => u.user_id === selectedUserId);

  return (
    <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      <label className="block text-sm font-medium text-foreground mb-2">
        {t("users.selectUser")}
      </label>

      <Select value={selectedUserId || ""} onValueChange={onSelect}>
        <SelectTrigger className="w-full sm:w-80 rounded-xl border-border bg-card">
          <SelectValue placeholder={t("users.selectUser")} />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.user_id} value={user.user_id}>
              {user.user}
              {user.average_rating !== null
                ? ` (${user.average_rating.toFixed(2)})`
                : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <div className="mt-3 flex items-center gap-2 w-full sm:w-80 rounded-xl border border-border bg-card px-3 py-2.5">
          <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
              {t("users.joinedLabel")}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {new Date(selected.joined_at).toLocaleDateString(i18n.language, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
