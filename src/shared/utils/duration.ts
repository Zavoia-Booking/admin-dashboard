/**
 * Sanitiser and cap for free-typed duration inputs (minutes).
 *
 * Lives outside the field components so every duration input in the app agrees
 * on the same ceiling, and so it can be unit-tested on its own. The companion
 * for money is `utils/decimalInput.ts`.
 */

/**
 * Longest a single service or override may run: 24 hours.
 *
 * An appointment is a day-scoped object everywhere it is handled — the calendar
 * lays it out inside one day column, `/calendar/day` returns it keyed by date,
 * and the booking-policy windows are measured against its start — so a slot
 * that spills past midnight has nowhere to render. Booking *policies*
 * (min/max advance notice, cancellation window) are a different measurement and
 * are deliberately not capped by this; they use `DurationInput` with days/hours
 * units and legitimately run to weeks.
 */
export const MAX_DURATION_MINUTES = 24 * 60; // 1440

/**
 * Reduces free-typed input to a whole number of minutes no greater than
 * {@link MAX_DURATION_MINUTES}.
 *
 * Non-digits are dropped (a duration has no separator and no sign) and anything
 * past the ceiling settles *on* the ceiling, so the field visibly snaps to
 * `1440` rather than quietly holding an impossible value. Leading zeros are
 * trimmed so `007` reads as `7`, while a lone `0` survives for the existing
 * "at least 1 minute" blur checks to report.
 *
 * Examples:
 *   `90`      → `90`
 *   `1500`    → `1440`
 *   `999999`  → `1440`
 *   `12abc`   → `12`
 *   `007`     → `7`
 *   `0`       → `0`
 *   ``        → ``
 */
export const sanitizeDurationInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (digits === "") return "";
  return String(Math.min(parseInt(digits, 10), MAX_DURATION_MINUTES));
};
