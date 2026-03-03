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
