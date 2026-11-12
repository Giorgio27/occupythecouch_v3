import type { TFunction } from "i18next";
import type { RadarRow } from "@/components/cineforum/stats/radar/RadarHexagon";
import type {
  ProfileAxisDTO,
  ProfileAxisKey,
  ShareAxisDTO,
} from "@/lib/shared/types";

/** The club's "average member" sits at the median of every percentile axis. */
const CLUB_PERCENTILE = 50;
const HOURS_PER_DAY = 24;

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

/** Formats a profile axis' raw metric in its own unit. */
function formatRaw(key: ProfileAxisKey, raw: number, t: TFunction): string {
  switch (key) {
    case "talent":
    case "cinephile":
      return `${raw.toFixed(2)} / 5`;
    case "presence":
      return `${Math.round(raw)}%`;
    case "speed":
      return raw < 2 * HOURS_PER_DAY
        ? t("radar.hours", { value: raw.toFixed(1) })
        : t("radar.days", { value: (raw / HOURS_PER_DAY).toFixed(1) });
    case "harmony":
      return `±${raw.toFixed(2)}`;
    case "generosity":
      return formatSigned(raw);
  }
}

function profileLabel(axis: ProfileAxisDTO, t: TFunction): string {
  if (axis.score === null || axis.raw === null) return t("radar.noData");
  return `${axis.score} · ${formatRaw(axis.key, axis.raw, t)}`;
}

/**
 * Rows for the profile hexagon. Without a second member (`b` null) the
 * comparison is the club median, 50 on every axis.
 */
export function buildProfileRows(
  a: ProfileAxisDTO[],
  b: ProfileAxisDTO[] | null,
  t: TFunction,
): RadarRow[] {
  return a.map((axisA, i) => {
    const axisB = b?.[i] ?? null;
    return {
      axis: t(`radar.profile.${axisA.key}`),
      a: axisA.score ?? 0,
      aLabel: profileLabel(axisA, t),
      b: axisB ? (axisB.score ?? 0) : CLUB_PERCENTILE,
      bLabel: axisB ? profileLabel(axisB, t) : String(CLUB_PERCENTILE),
    };
  });
}

function shareLabel(axis: ShareAxisDTO<string>, t: TFunction): string {
  const count = Number.isInteger(axis.count) ? axis.count : axis.count.toFixed(1);
  return `${Math.round(axis.share * 100)}% · ${t("radar.movies", { count: Number(count), value: count })}`;
}

/**
 * Rows for a taste hexagon (eras or regions), labels from `radar.<group>.<key>`.
 * Shares are plotted on a square-root scale, normalized so the biggest one on
 * show touches the edge: a 60% North America would otherwise flatten a 3%
 * East Asia into the center. Tooltips keep the real percentages.
 */
export function buildShareRows<K extends string>(
  group: "eras" | "regions",
  a: ShareAxisDTO<K>[],
  b: ShareAxisDTO<K>[],
  t: TFunction,
): RadarRow[] {
  const maxShare = Math.max(...a.map((x) => x.share), ...b.map((x) => x.share));
  const scale = (share: number): number =>
    maxShare > 0 ? Math.sqrt(share / maxShare) : 0;

  return a.map((axisA, i) => ({
    axis: t(`radar.${group}.${axisA.key}`),
    a: scale(axisA.share),
    aLabel: shareLabel(axisA, t),
    b: scale(b[i].share),
    bLabel: shareLabel(b[i], t),
  }));
}
