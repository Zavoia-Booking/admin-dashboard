export interface WorkingHourEntry {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

/** Normalize workingHours from array or object format to array of { day, isOpen, openTime, closeTime }. */
export function normalizeWorkingHours(
  wh:
    | WorkingHourEntry[]
    | Record<string, { open?: string; close?: string; isOpen?: boolean }>
    | null
    | undefined
): WorkingHourEntry[] {
  if (!wh) return [];
  if (Array.isArray(wh)) return wh;
  return DAY_ORDER.map((day, i) => {
    const key = DAY_KEYS[i];
    const entry = wh[key] ?? wh[day] ?? wh[day.toLowerCase()];
    if (!entry) return { day, isOpen: false };
    return {
      day,
      isOpen: entry.isOpen ?? false,
      openTime: entry.open,
      closeTime: entry.close,
    };
  });
}
