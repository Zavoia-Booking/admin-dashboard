import type { TFunction } from "i18next";

/**
 * Format a minute count into a localized duration string.
 *
 * Output shape:
 *   0    → "0 min"
 *   <60  → "{m} min"
 *   exact hour → "{h}h"
 *   mixed → "{h}h {m}min"
 *
 * Hour and minute units come from `common.units.*` so Romanian and English
 * render consistently. Pass `t` from any `useTranslation(...)` scope —
 * cross-namespace `common:` keys work from any namespace.
 */
export function formatDuration(minutes: number, t: TFunction): string {
  const safe = Math.max(0, Math.floor(minutes ?? 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  const hUnit = t("common:units.hourShort");
  const mUnit = t("common:units.minuteShort");
  if (h === 0) return `${m} ${mUnit}`;
  if (m === 0) return `${h}${hUnit}`;
  return `${h}${hUnit} ${m}${mUnit}`;
}
