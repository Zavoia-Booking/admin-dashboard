import { aggregateReviews } from "../../shared/util";
import type { PreviewData } from "../../shared/types";

/** One About stat cell — a real, derived business number + its i18n label key. The design's fourth cell
 *  ("Established {year}") has no backing field in the product, so About surfaces up to three real cells
 *  (locations, team, rating), each present only when its underlying value is meaningful. Built once here so
 *  every stats-bearing About variant (editorial / manifesto / ledger / …) agrees on the same derivation
 *  and gating rather than drifting per file. */
export type AboutStat = { n: number; dec: number; labelKey: string };

export function computeAboutStats(data: PreviewData): AboutStat[] {
  const stats: AboutStat[] = [];
  if (data.locations.length > 0) {
    stats.push({ n: data.locations.length, dec: 0, labelKey: "businessPage.builder.preview.statLocations" });
  }
  // Team is a business-wide headcount: the same member can be assigned to several locations, so dedup by id.
  const team = new Set<number>();
  for (const l of data.locations) for (const m of l.teamMembers ?? []) team.add(m.id);
  if (team.size > 0) {
    stats.push({ n: team.size, dec: 0, labelKey: "businessPage.builder.preview.statTeam" });
  }
  const { rating, count } = aggregateReviews(data.locations);
  if (count > 0) {
    stats.push({ n: rating, dec: 1, labelKey: "businessPage.builder.preview.statRating" });
  }
  return stats;
}
