import i18n from "../../shared/lib/i18n";

/** Returns the BCP 47 locale tag for Intl date/time formatting based on current i18n language. */
export function getCalendarLocale(): string {
  const lang = i18n.language;
  if (lang === 'ro') return 'ro-RO';
  return 'en-GB';
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(
  timeZone: string,
  options: Omit<Intl.DateTimeFormatOptions, 'timeZone'>,
): Intl.DateTimeFormat {
  const key = `${timeZone}:${JSON.stringify(options)}`;
  const existing = dtfCache.get(key);
  if (existing) return existing;
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, ...options });
  dtfCache.set(key, formatter);
  return formatter;
}

function getPartMap(date: Date, timeZone: string): Record<string, string> {
  const formatter = getFormatter(timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
}

export function formatDateInTimezone(date: Date, timeZone: string): string {
  const parts = getPartMap(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * Parses `YYYY-MM-DD` as a calendar day at local midnight (browser local).
 * Pairs with {@link formatDateInTimezone} for wall dates and with pickers that compare y/m/d.
 */
export function localCalendarDateFromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "Today" in `timeZone` as a local `Date` for date-picker `minDate` / disabling past days. */
export function minSelectableCalendarDateForTimezone(now: Date, timeZone: string): Date {
  const tz = timeZone?.trim() || 'UTC';
  return localCalendarDateFromDateKey(formatDateInTimezone(now, tz));
}

/** Later of two instants by local calendar day (year / month / date). */
export function laterCalendarWallDate(a: Date, b: Date): Date {
  const ta = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const tb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return ta >= tb ? a : b;
}

/** True when `endsAt` (ISO instant) is on or before `now` — use for gating cancel on past bookings. */
export function isAppointmentEndInPast(
  endsAt: string | Date,
  now: Date = new Date(),
): boolean {
  const end = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() <= now.getTime();
}

export function getMinutesInTimezone(iso: string, timeZone: string): number {
  const parts = getPartMap(new Date(iso), timeZone);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function getOffsetMinutes(date: Date, timeZone: string): number {
  const parts = getPartMap(date, timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - date.getTime()) / 60000;
}

function buildZonedDateFromParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const baseUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  // Iterate once to stabilize around DST boundaries.
  let candidate = new Date(baseUtcMs - getOffsetMinutes(new Date(baseUtcMs), timeZone) * 60_000);
  const adjustedOffset = getOffsetMinutes(candidate, timeZone);
  candidate = new Date(baseUtcMs - adjustedOffset * 60_000);

  return candidate;
}

export function buildZonedDateFromDateKey(dateKey: string, hhmm: string, timeZone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = hhmm.split(':').map(Number);
  return buildZonedDateFromParts(year, month, day, hour, minute, timeZone);
}

export function buildZonedDate(date: Date, hhmm: string, timeZone: string): Date {
  const [hour, minute] = hhmm.split(':').map(Number);
  const dateInTz = formatDateInTimezone(date, timeZone);
  const [year, month, day] = dateInTz.split('-').map(Number);
  return buildZonedDateFromParts(year, month, day, hour, minute, timeZone);
}

/** Start of calendar day (00:00) in `timeZone`, as UTC `Date`. */
export function zonedStartOfDayUtc(wallDate: Date, timeZone: string): Date {
  const dateKey = formatDateInTimezone(wallDate, timeZone);
  return buildZonedDateFromDateKey(dateKey, '00:00', timeZone);
}

/** End of calendar day in `timeZone` (last ms of 23:59), as UTC `Date`. */
export function zonedEndOfDayUtc(wallDate: Date, timeZone: string): Date {
  const dateKey = formatDateInTimezone(wallDate, timeZone);
  const lastMinute = buildZonedDateFromDateKey(dateKey, '23:59', timeZone);
  return new Date(lastMinute.getTime() + 59_999);
}

/** Map `en-US` short weekday → JS Sunday=0 … Saturday=6 (matches API `repeatDaysOfWeek`). */
const WEEKDAY_SHORT_TO_SUN0: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Weekday index for the wall calendar day of `wallDate` in `timeZone` (0 = Sunday … 6 = Saturday).
 * Uses noon on that wall day to avoid DST edge cases.
 */
export function weekdaySun0ForWallDateInTimezone(wallDate: Date, timeZone: string): number {
  const atNoon = buildZonedDate(wallDate, '12:00', timeZone);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).formatToParts(atNoon);
  const wd = parts.find((p) => p.type === 'weekday')?.value;
  if (wd != null && wd in WEEKDAY_SHORT_TO_SUN0) return WEEKDAY_SHORT_TO_SUN0[wd]!;
  return 0;
}

/** "HH:mm" 24h for an instant interpreted in `timeZone` (for block forms, prefill). */
export function formatWallHmInTimezone(isoOrDate: string | Date, timeZone: string): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '00:00';
  const parts = getPartMap(d, timeZone);
  const h = parts.hour?.padStart(2, '0') ?? '00';
  const m = parts.minute?.padStart(2, '0') ?? '00';
  return `${h}:${m}`;
}

/** Format instant in business/calendar timezone for audit-style display. */
export function formatDateTimeInTimezone(
  date: Date | string | null | undefined,
  timeZone: string,
): string {
  if (date == null || date === '') return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Long date in TZ (appointment detail overview). Optional short weekday for compact lines. */
export function formatDetailOverviewDate(
  date: Date | string,
  timeZone: string,
  options?: { weekday?: 'long' | 'short' },
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(getCalendarLocale(), {
    timeZone,
    weekday: options?.weekday === 'short' ? 'short' : 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Consistent date+time for booking history rows (same locale as overview family). */
export function formatDetailHistoryDateTime(
  date: Date | string | null | undefined,
  timeZone: string,
): string {
  if (date == null || date === '') return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(getCalendarLocale(), {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Compact "12 Mar, 14:22" style for activity / timeline rows (no year). */
export function formatActivityTimelineDateTime(
  date: Date | string | null | undefined,
  timeZone: string,
): string {
  if (date == null || date === '') return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  const datePart = d.toLocaleDateString(getCalendarLocale(), {
    timeZone,
    day: 'numeric',
    month: 'short',
  });
  const timePart = d.toLocaleTimeString(getCalendarLocale(), {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart}, ${timePart}`;
}
