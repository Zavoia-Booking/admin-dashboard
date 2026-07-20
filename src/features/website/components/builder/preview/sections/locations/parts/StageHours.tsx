import { Clock } from "lucide-react";
import type { WebsiteBuilderLocation } from "../../../../../../types";
import { MONO } from "../../../shared/constants";
import { DAY_KEYS, locationClock, type DayKey } from "../../../shared/contact";
import type { T } from "../../../shared/types";

/** Opening-hours list for the stage — consecutive days with identical hours collapse into ranges
 *  (Mon–Wed), today highlighted, closed days in accent (mirrors the design .lb-locx-hours). */
export function StageHours({ loc, t }: { loc: WebsiteBuilderLocation; t: T }) {
  const wh = (loc.workingHours ?? {}) as Partial<Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>>;
  const todayIdx = locationClock(loc).dayIndex;
  const closedLabel = t("businessPage.builder.preview.contactClosed");

  const dayValue = (d: DayKey): string => {
    if (loc.open247) return t("businessPage.builder.preview.contactOpen247");
    const day = wh[d];
    return day && day.isOpen && day.open && day.close ? `${day.open} – ${day.close}` : closedLabel;
  };
  // Collapse consecutive days with identical hours into ranges, in week order.
  const rows: { start: number; end: number; value: string }[] = [];
  DAY_KEYS.forEach((d, i) => {
    const v = dayValue(d);
    const last = rows[rows.length - 1];
    if (last && last.value === v) last.end = i;
    else rows.push({ start: i, end: i, value: v });
  });
  const rowLabel = (r: { start: number; end: number }): string =>
    r.start === r.end
      ? t(`businessPage.builder.preview.daysFull.${DAY_KEYS[r.start]}`)
      : `${t(`businessPage.builder.preview.days.${DAY_KEYS[r.start]}`)}–${t(`businessPage.builder.preview.days.${DAY_KEYS[r.end]}`)}`;

  return (
    <div>
      <div className="mb-3.5 inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
        <Clock className="h-3.5 w-3.5" strokeWidth={1.6} />
        {t("businessPage.builder.preview.contactHours")}
      </div>
      <div>
        {rows.map((r, i) => {
          const today = todayIdx >= r.start && todayIdx <= r.end;
          const closed = r.value === closedLabel;
          const isLast = i === rows.length - 1;
          return (
            <div
              key={r.start}
              className="mc-locx-rowin flex items-center justify-between gap-6 text-[13.5px]"
              style={{
                padding: today ? "7px 12px" : "7px 0",
                margin: today ? "0 -12px" : undefined,
                borderRadius: today ? 6 : undefined,
                borderBottom: today || isLast ? "1px solid transparent" : "1px solid var(--mc-line)",
                background: today ? "color-mix(in oklch, var(--mc-accent) 7%, transparent)" : undefined,
                animationDelay: `${160 + i * 55}ms`,
              }}
            >
              <span style={{ color: "var(--mc-fg)", fontWeight: today ? 600 : 400 }}>{rowLabel(r)}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: today ? 600 : 400, color: closed ? "var(--mc-accent)" : today ? "var(--mc-fg)" : "var(--mc-muted)" }}>
                {r.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
