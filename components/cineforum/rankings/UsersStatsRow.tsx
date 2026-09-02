import { useTranslation } from "react-i18next";
import { Trophy, Users, Award, Film } from "lucide-react";
import { StatCard } from "@/components/cineforum/common";

type Props = {
  totalUsers: number;
  totalMoviesVoted: number;
  avgRating: number;
  totalWins: number;
};

/** The four summary stat cards at the top of the users ranking page. */
export default function UsersStatsRow({
  totalUsers,
  totalMoviesVoted,
  avgRating,
  totalWins,
}: Props) {
  const { t } = useTranslation("rankings");

  return (
    <div
      className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 animate-fade-in-up"
      style={{ animationDelay: "100ms" }}
    >
      <StatCard
        icon={<Users className="w-5 h-5 text-primary" />}
        iconBg="bg-primary/10"
        label={t("users.statUsers")}
        value={totalUsers}
      />
      <StatCard
        icon={<Film className="w-5 h-5 text-green-500" />}
        iconBg="bg-green-500/10"
        label={t("users.statMoviesVoted")}
        value={totalMoviesVoted}
      />
      <StatCard
        icon={<Award className="w-5 h-5 text-amber-500" />}
        iconBg="bg-amber-500/10"
        label={t("users.statAverage")}
        value={avgRating.toFixed(2)}
      />
      <StatCard
        icon={<Trophy className="w-5 h-5 text-yellow-500" />}
        iconBg="bg-yellow-500/10"
        label={t("users.statWins")}
        value={totalWins}
      />
    </div>
  );
}
