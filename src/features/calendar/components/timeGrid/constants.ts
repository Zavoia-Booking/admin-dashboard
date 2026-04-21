// ─────────────────────────────────────────────────────────────
// Grid layout constants
// ─────────────────────────────────────────────────────────────

export const HOUR_HEIGHT = 128; // px per hour (legacy hour-based grid)
export const GRID_HEIGHT_PER_HOUR = 160; // px per hour for 15-min slot grid (→ 40px per slot)
/** Mobile timeline row height — 128 px/hour gives 32 px per 15-min slot,
 *  matching MIN_APPOINTMENT_HEIGHT_PX so a 15-min card sits inside exactly one slot. */
export const MOBILE_GRID_HEIGHT_PER_HOUR = 128;
export const GRID_START_HOUR = 6; // 6 AM
export const GRID_END_HOUR = 22; // 10 PM
export const GRID_HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
export const GUTTER_WIDTH = 60; // px - slightly wider for cleaner look
/** Mobile time-axis gutter (narrower than desktop). */
export const MOBILE_GUTTER_WIDTH = 44;
/** Minimum per-staff column width on mobile. 112 px fits ~3 columns + peek on 390 px viewport. */
export const MOBILE_COLUMN_MIN_WIDTH = 112;

/** When more than this many staff columns are visible, the grid becomes horizontally scrollable. */
export const COLUMN_SCROLL_THRESHOLD = 6;
/** Delay before opening reschedule confirm dialog so the card can settle after drop. */
export const CONFIRM_MODAL_DELAY_MS = 320;

export const EMPTY_FORBIDDEN_SLOT_SET: ReadonlySet<string> = new Set();

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type GridSlot = { hour: number; minute: number };

export interface PendingReschedulePayload {
  appointmentId: number;
  newScheduledAt: Date;
  newEndsAt: Date;
  staffUserIds?: number[];
  bookingGroupId?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export const formatHourLabel = (hour: number, is24h?: boolean): string => {
  if (is24h) return `${String(hour).padStart(2, '0')}:00`;
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

export const formatNowLabel = (nowMinutes: number, is24h?: boolean): string => {
  const h = Math.floor(nowMinutes / 60);
  const m = nowMinutes % 60;
  if (is24h) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
