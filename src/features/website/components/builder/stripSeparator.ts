import type { StripSeparatorStyle } from "../../types";

export const STRIP_SEPARATOR_STYLES = [
  "pearl",
  "diamond",
  "slash",
  "sparkle",
  "ring",
] as const satisfies readonly StripSeparatorStyle[];

export const DEFAULT_STRIP_SEPARATOR: StripSeparatorStyle = "pearl";

/** Persisted as a percentage so the setting stays independent of responsive Strip typography. */
export const STRIP_SEPARATOR_SIZE_MIN = 70;
export const STRIP_SEPARATOR_SIZE_MAX = 140;
export const STRIP_SEPARATOR_SIZE_STEP = 5;
export const DEFAULT_STRIP_SEPARATOR_SIZE = 100;

/** Keeps the design-source 19px floor at a readable 16px or larger. */
export const STRIP_TEXT_SIZE_MIN = 85;
export const STRIP_TEXT_SIZE_MAX = 140;
export const STRIP_TEXT_SIZE_STEP = 5;
export const DEFAULT_STRIP_TEXT_SIZE = 100;

export function normalizeStripSeparatorStyle(value: unknown): StripSeparatorStyle {
  return STRIP_SEPARATOR_STYLES.includes(value as StripSeparatorStyle)
    ? (value as StripSeparatorStyle)
    : DEFAULT_STRIP_SEPARATOR;
}

export function normalizeStripSeparatorSize(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_STRIP_SEPARATOR_SIZE;
  }

  const clamped = Math.min(STRIP_SEPARATOR_SIZE_MAX, Math.max(STRIP_SEPARATOR_SIZE_MIN, value));
  const stepped = STRIP_SEPARATOR_SIZE_MIN
    + Math.round((clamped - STRIP_SEPARATOR_SIZE_MIN) / STRIP_SEPARATOR_SIZE_STEP)
      * STRIP_SEPARATOR_SIZE_STEP;
  return Math.min(STRIP_SEPARATOR_SIZE_MAX, Math.max(STRIP_SEPARATOR_SIZE_MIN, stepped));
}

export function normalizeStripTextSize(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_STRIP_TEXT_SIZE;
  }

  const clamped = Math.min(STRIP_TEXT_SIZE_MAX, Math.max(STRIP_TEXT_SIZE_MIN, value));
  const stepped = STRIP_TEXT_SIZE_MIN
    + Math.round((clamped - STRIP_TEXT_SIZE_MIN) / STRIP_TEXT_SIZE_STEP)
      * STRIP_TEXT_SIZE_STEP;
  return Math.min(STRIP_TEXT_SIZE_MAX, Math.max(STRIP_TEXT_SIZE_MIN, stepped));
}
