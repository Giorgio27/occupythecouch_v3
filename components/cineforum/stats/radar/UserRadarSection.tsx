import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Globe, Hexagon, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/cineforum/common";
import RadarHexagon from "@/components/cineforum/stats/radar/RadarHexagon";
import TopCountries from "@/components/cineforum/stats/radar/TopCountries";
import RadarHelp from "@/components/cineforum/stats/radar/RadarHelp";
import {
  buildProfileRows,
  buildShareRows,
} from "@/components/cineforum/stats/radar/radarRows";
import type { UserRadarResponseDTO } from "@/lib/shared/types";

type UserRadarSectionProps = {
  radar: UserRadarResponseDTO;
  selectedUserId: string;
};

const CLUB = "club";
const PERCENTILE_MAX = 100;
/** Taste rows are already normalized to 0–1 by `buildShareRows`. */
const SHARE_MAX = 1;

/** The three PES-style hexagons: selected member vs another member or the club. */
export default function UserRadarSection({
  radar,
  selectedUserId,
}: UserRadarSectionProps) {
  const { t } = useTranslation("stats");
  const [compareId, setCompareId] = useState<string>(CLUB);

  const userA = radar.body.find((u) => u.user_id === selectedUserId);
  const userB =
    compareId === selectedUserId
      ? undefined
      : radar.body.find((u) => u.user_id === compareId);

  if (!userA) return null;

  const tasteB = userB ?? radar.club;
  const seriesB = userB
    ? { name: userB.user_name, isClub: false }
    : { name: t("radar.club"), isClub: true };
  const profileRows = buildProfileRows(userA.profile, userB?.profile ?? null, t);
  const eraRows = buildShareRows("eras", userA.eras, tasteB.eras, t);
  const regionRows = buildShareRows("regions", userA.regions, tasteB.regions, t);
  const others = radar.body.filter((u) => u.user_id !== selectedUserId);

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <SectionHeader
          icon={<Hexagon className="w-4 h-4" />}
          title={t("radar.title")}
          subtitle={t("radar.subtitle")}
        />
        <Select value={userB ? compareId : CLUB} onValueChange={setCompareId}>
          <SelectTrigger className="w-full sm:w-64 rounded-xl border-border bg-card">
            <SelectValue placeholder={t("radar.compareWith")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CLUB}>{t("radar.club")}</SelectItem>
            {others.map((u) => (
              <SelectItem key={u.user_id} value={u.user_id}>
                {u.user_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <RadarHelp />

      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="w-3 h-3 shrink-0 rounded-full bg-primary" />
          <span className="truncate font-semibold text-foreground">{userA.user_name}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={`w-3 h-3 shrink-0 rounded-full ${userB ? "bg-amber-500" : "border border-dashed border-muted-foreground"}`}
          />
          <span className="truncate text-muted-foreground">{seriesB.name}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <RadarHexagon
          title={t("radar.profileTitle")}
          subtitle={t("radar.profileSubtitle")}
          icon={<Sparkles className="w-4 h-4" />}
          rows={profileRows}
          maxValue={PERCENTILE_MAX}
          seriesA={userA.user_name}
          seriesB={seriesB}
        />
        <RadarHexagon
          title={t("radar.erasTitle")}
          subtitle={t("radar.erasSubtitle")}
          icon={<Clock className="w-4 h-4" />}
          rows={eraRows}
          maxValue={SHARE_MAX}
          seriesA={userA.user_name}
          seriesB={seriesB}
        />
        <RadarHexagon
          title={t("radar.regionsTitle")}
          subtitle={t("radar.regionsSubtitle")}
          icon={<Globe className="w-4 h-4" />}
          rows={regionRows}
          maxValue={SHARE_MAX}
          seriesA={userA.user_name}
          seriesB={seriesB}
        >
          <TopCountries countries={userA.top_countries} />
        </RadarHexagon>
      </div>
    </div>
  );
}
