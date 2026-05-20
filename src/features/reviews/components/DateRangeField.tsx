import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  addMonths,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { enUS, ro } from "date-fns/locale";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../shared/lib/utils";

export type DatePreset = "any" | "7d" | "30d" | "90d" | "custom";

interface Props {
  preset: DatePreset;
  startDate: string | null;
  endDate: string | null;
  onChange: (
    preset: DatePreset,
    startDate: string | null,
    endDate: string | null,
  ) => void;
}

/**
 * Compute the (startDate, endDate) ISO pair for a non-custom preset. "Last
 * N days" presets are open-ended on the upper bound (endDate = null) — the
 * backend treats missing endDate as "up to now", and this lets future reviews
 * keep falling into the bucket without re-applying the filter.
 */
export function computePresetRange(
  preset: Exclude<DatePreset, "custom" | "any">,
): { startDate: string; endDate: null } {
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  return {
    startDate: startOfDay(subDays(new Date(), days)).toISOString(),
    endDate: null,
  };
}

/**
 * Same chip recipe as ReviewsFiltersSheet so date presets feel like the
 * other filter pills (h-10, px-4, relative for corner checkmark).
 */
const chipClass = (selected: boolean) =>
  cn(
    "relative inline-flex items-center gap-1.5 h-10 px-4 rounded-full border text-xs font-medium",
    "transition-[transform,colors,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer",
    "active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2",
    selected
      ? "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs hover:border-neutral-500 hover:bg-info-100"
      : "border-border bg-surface text-foreground-1 hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900",
  );

/** Corner stamp on selected chip — duplicated locally (same recipe as the
 *  sheet) to avoid cross-feature imports. */
function ChipCheckmark() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -right-0 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-green-400 shadow-sm dark:bg-success"
    >
      <svg
        className="h-3 w-3 text-foreground-inverse"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export function DateRangeField({
  preset,
  startDate,
  endDate,
  onChange,
}: Props) {
  const { t, i18n } = useTranslation("reviews");
  const dateLocale = i18n.language === "ro" ? ro : enUS;

  // Calendar visibility is local + decoupled from `preset` so users can
  // collapse the calendar without losing their picked custom dates. The
  // effect below keeps it in sync when the preset switches from elsewhere
  // (e.g. clicking "Last 30 days" should close the calendar).
  const [calendarOpen, setCalendarOpen] = useState(preset === "custom");
  useEffect(() => {
    setCalendarOpen(preset === "custom");
  }, [preset]);

  const handlePresetClick = (key: DatePreset) => {
    if (key === "any") {
      onChange("any", null, null);
      return;
    }
    if (key === "custom") {
      if (preset === "custom") {
        // Already in custom mode — toggle calendar visibility, preserve
        // the user's picked dates.
        setCalendarOpen((open) => !open);
        return;
      }
      // Switching INTO custom from a different preset (any / 7d / 30d / 90d).
      // The current startDate/endDate were derived from that preset, not
      // chosen by the user as a custom range — clear them so the calendar
      // opens blank instead of inheriting preset-derived dates.
      onChange("custom", null, null);
      setCalendarOpen(true);
      return;
    }
    const range = computePresetRange(key);
    onChange(key, range.startDate, range.endDate);
  };

  const isAny = preset === "any";

  // Quick presets — short labels (no "Last " prefix) so the whole row fits
  // alongside the "Any time" chip in the 460px modal. Section title already
  // sets the temporal context. Three chrome levels:
  // chip (Any time, the clear option) → naked text (quick presets) →
  // text + chevron (Custom, the advanced option that expands the calendar).
  // Mirrors the [Stars] section structure so the sheet feels unified.
  const quickPresets: Array<{ key: DatePreset; label: string }> = [
    { key: "7d", label: t("filter.date7Days") },
    { key: "30d", label: t("filter.date30Days") },
    { key: "90d", label: t("filter.date90Days") },
  ];

  return (
    <div>
      {/* Mobile (<sm): every preset uses the same chip recipe so the row
          reads as one consistent group. Heterogeneous "chip + hairline +
          naked text" hierarchy from the desktop layout below was too noisy
          in a 340px-wide drawer — same visual weight + flex-wrap fits the
          touch-friendly h-10 pills cleanly across two lines. */}
      <div className="sm:hidden flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={isAny}
          onClick={() => handlePresetClick("any")}
          className={chipClass(isAny)}
        >
          {t("filter.dateAny")}
          {isAny && <ChipCheckmark />}
        </button>
        {quickPresets.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={preset === key}
            onClick={() => handlePresetClick(key)}
            className={chipClass(preset === key)}
          >
            {label}
            {preset === key && <ChipCheckmark />}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={preset === "custom"}
          onClick={() => handlePresetClick("custom")}
          className={chipClass(preset === "custom")}
        >
          {t("filter.dateCustom")}
          <ChevronDown
            aria-hidden
            className={cn(
              "h-3 w-3 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
              calendarOpen && "rotate-180",
            )}
          />
          {preset === "custom" && <ChipCheckmark />}
        </button>
      </div>

      {/* Desktop (sm+): three-level hierarchy preserved.
          chip (Any time, the clear option) → naked text (quick presets) →
          text + chevron (Custom, the advanced option that expands the
          calendar). Mirrors the [Stars] section structure so the dialog
          feels unified across filter sections. */}
      <div className="hidden sm:flex items-center gap-3">
        <button
          type="button"
          aria-pressed={isAny}
          onClick={() => handlePresetClick("any")}
          className={chipClass(isAny)}
        >
          {t("filter.dateAny")}
          {isAny && <ChipCheckmark />}
        </button>

        <span className="w-px h-6 bg-border shrink-0" aria-hidden />

        <div className="flex items-center gap-3 flex-wrap min-w-0">
          {quickPresets.map(({ key, label }) => (
            <PresetButton
              key={key}
              selected={preset === key}
              onClick={() => handlePresetClick(key)}
            >
              {label}
            </PresetButton>
          ))}

          <PresetButton
            selected={preset === "custom"}
            onClick={() => handlePresetClick("custom")}
          >
            {t("filter.dateCustom")}
            <ChevronDown
              aria-hidden
              className={cn(
                "h-3 w-3 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
                calendarOpen && "rotate-180",
              )}
            />
          </PresetButton>
        </div>
      </div>

      {/* Animated collapsible reveal — always mounted so we can transition
          in BOTH directions (CSS transitions can't run on unmount). The
          grid-rows trick handles height; the inner div carries the iOS-curve
          scale + opacity for the menu-style "drop from the button" feel.
          `pt-3` lives inside the collapsible so the spacing disappears when
          closed (no orphan margin). */}
      <div
        aria-hidden={!calendarOpen}
        className={cn(
          "grid transition-[grid-template-rows] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]",
          calendarOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        style={{ transitionDuration: "250ms" }}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "pt-3 origin-top",
              "transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]",
              calendarOpen
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none",
            )}
            style={{ transitionDuration: "250ms" }}
          >
            <CustomRangeCalendar
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => onChange("custom", start, end)}
              locale={dateLocale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Naked text button for quick presets — no border, no background.
 * Hierarchy lives entirely in weight + color (impeccable): inactive is
 * `text-foreground-3 font-medium`, selected gets `text-foreground-1
 * font-semibold` for a ≥1.25 weight-and-color step. iOS-curve press scale
 * keeps the tactile feedback consistent with the rest of the sheet.
 */
function PresetButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-1 py-2 text-xs cursor-pointer",
        "transition-[color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "active:scale-[0.97]",
        "hover:text-foreground-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2 focus-visible:rounded-md",
        selected
          ? "text-foreground-1 font-semibold"
          : "text-foreground-3 font-medium",
      )}
    >
      {children}
    </button>
  );
}

interface CalendarProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (startDate: string | null, endDate: string | null) => void;
  locale: typeof enUS;
}

function CustomRangeCalendar({
  startDate,
  endDate,
  onChange,
  locale,
}: CalendarProps) {
  const { t } = useTranslation("reviews");
  const start = startDate ? parseISO(startDate) : null;
  const end = endDate ? parseISO(endDate) : null;

  // Show the month of the start date by default, today otherwise. Track via
  // state so navigation arrows don't snap back on every render.
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    () => startOfMonth(start ?? new Date()),
  );

  // While the user has picked a start but not yet an end, hovering a day
  // previews the range — exactly what they're about to commit. Reset on
  // mouse-leave of the grid.
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  // Reset visible month when the range is cleared from outside (e.g. user
  // hits Clear all). Depend on the ISO strings (stable across renders), not
  // the parsed Dates (new instance every render → effect storm).
  useEffect(() => {
    if (!startDate && !endDate) {
      setVisibleMonth(startOfMonth(new Date()));
    }
  }, [startDate, endDate]);

  const weekStartsOn = ((locale.options?.weekStartsOn ?? 0) as
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6);
  const days = useMemo(
    () => generateMonthGrid(visibleMonth, weekStartsOn),
    [visibleMonth, weekStartsOn],
  );
  const weekDayLabels = useMemo(() => {
    const refStart = startOfWeek(new Date(), { locale });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(refStart);
      d.setDate(refStart.getDate() + i);
      return format(d, "EEEEE", { locale });
    });
  }, [locale]);

  const todayEnd = endOfDay(new Date());
  const isFuture = (day: Date) => isAfter(day, todayEnd);

  // Effective range — committed when both endpoints exist, otherwise a live
  // preview from start ↔ hoveredDay (swaps if user hovers before start).
  // Same logic powers `isInRange` + `isRangeStart` + `isRangeEnd` so the
  // committed and preview visuals stay identical (no flicker on commit).
  const effectiveRange = ((): { from: Date; to: Date } | null => {
    if (start && end) return { from: start, to: end };
    if (start && hoveredDay && !isSameDay(hoveredDay, start)) {
      return isBefore(hoveredDay, start)
        ? { from: hoveredDay, to: start }
        : { from: start, to: hoveredDay };
    }
    if (start) return { from: start, to: start };
    return null;
  })();

  const handleDayClick = (day: Date) => {
    if (isFuture(day)) return;
    const dayStart = startOfDay(day).toISOString();
    const dayEnd = endOfDay(day).toISOString();

    if (!start || (start && end)) {
      onChange(dayStart, null);
      return;
    }
    if (isBefore(day, start)) {
      onChange(dayStart, endOfDay(start).toISOString());
    } else {
      onChange(start.toISOString(), dayEnd);
    }
  };

  const isInRange = (day: Date) => {
    if (!effectiveRange) return false;
    return (
      (isAfter(day, effectiveRange.from) ||
        isSameDay(day, effectiveRange.from)) &&
      (isBefore(day, effectiveRange.to) || isSameDay(day, effectiveRange.to))
    );
  };

  const isCurrentMonth = isSameDay(
    startOfMonth(visibleMonth),
    startOfMonth(new Date()),
  );

  return (
    <div>
      {/* Header — month name as a typographic anchor (left), nav + Today
          on the right. No card chrome around the calendar; it lives in
          the section's natural padding. */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold tabular-nums capitalize text-foreground-1">
          {format(visibleMonth, "LLLL yyyy", { locale })}
        </div>
        <div className="flex items-center gap-0.5">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setVisibleMonth(startOfMonth(new Date()))}
              className="px-2 h-7 text-[11px] font-medium text-foreground-3 hover:text-primary rounded-md transition-colors duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
            >
              {t("filter.calendarToday")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-foreground-2 hover:bg-surface-hover hover:text-foreground-1 transition-[transform,colors] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.92] cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-foreground-2 hover:bg-surface-hover hover:text-foreground-1 transition-[transform,colors] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.92] cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day grid — no gap-x/gap-y between cells so the range pill flows
          continuously across days. Row-wrap breaks visual continuity at week
          boundaries (expected calendar behavior). */}
      <div
        className="grid grid-cols-7"
        onMouseLeave={() => setHoveredDay(null)}
      >
        {weekDayLabels.map((label, i) => (
          <div
            key={`wd-${i}`}
            className="h-7 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-foreground-3"
          >
            {label}
          </div>
        ))}
        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }
          const inRange = isInRange(day);
          const isRangeStart =
            effectiveRange && isSameDay(day, effectiveRange.from);
          const isRangeEnd =
            effectiveRange && isSameDay(day, effectiveRange.to);
          const isSinglePoint = isRangeStart && isRangeEnd;
          const isEndpoint = isRangeStart || isRangeEnd;
          const today = isToday(day);
          const disabled = isFuture(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              aria-disabled={disabled || undefined}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => !disabled && setHoveredDay(day)}
              className={cn(
                "relative h-9 flex items-center justify-center text-sm tabular-nums",
                "transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
                disabled && "text-foreground-3/40 cursor-not-allowed",
                !disabled && "cursor-pointer active:scale-[0.92]",
                // Range middle (not endpoint) — flat tint that bridges between
                // endpoints to form a continuous pill across the row.
                !disabled &&
                  inRange &&
                  !isEndpoint &&
                  "bg-primary/15 text-foreground-1",
                // Endpoints — solid primary + white text. Rounded only on the
                // outer side; inner side stays flat so it visually connects
                // to the middle tint.
                !disabled &&
                  isEndpoint &&
                  "bg-primary text-white font-semibold",
                !disabled &&
                  isSinglePoint &&
                  "rounded-full",
                !disabled &&
                  isRangeStart &&
                  !isRangeEnd &&
                  "rounded-l-full",
                !disabled &&
                  isRangeEnd &&
                  !isRangeStart &&
                  "rounded-r-full",
                // Plain cells (no range, no endpoint) — light hover pill.
                !disabled &&
                  !inRange &&
                  !isEndpoint &&
                  "hover:bg-surface-hover rounded-full",
                // Today text emphasis only when not part of the range visual.
                !disabled &&
                  !inRange &&
                  !isEndpoint &&
                  today &&
                  "text-primary font-semibold",
                !disabled &&
                  !inRange &&
                  !isEndpoint &&
                  !today &&
                  "text-foreground-1",
              )}
            >
              {day.getDate()}
              {/* Today dot — delicate accent under the number; hidden when
                  the cell is part of the range (the colored bg already
                  communicates emphasis). */}
              {today && !inRange && !isEndpoint && (
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Produce a 7-column grid of Dates for the given month, padded with `null`
 * for the leading days that belong to the previous month so the grid lines
 * up with weekday headers. `weekStartsOn` follows date-fns's convention
 * (0 = Sun, 1 = Mon) so RO/EN week alignment stays consistent with locale.
 */
function generateMonthGrid(
  month: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0,
): Array<Date | null> {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const firstDayIdx = first.getDay();
  const leadingBlanks = (firstDayIdx - weekStartsOn + 7) % 7;
  const totalDays = last.getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  return cells;
}
