import type { LocationWithAssignments } from "../../../../types";

// Day keys for opening-hours rows, reused by the Locations stage and the Footer detail.
export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export const DAY_KEYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Pretty caption address — structured "street, city" (no postal code / country), falling back to the
 *  raw formatted address only when components are absent. */
export const prettyAddress = (l: LocationWithAssignments): string => {
  const c = l.addressComponents;
  const street = c?.street?.trim()
    ? `${c.streetNumber?.trim() ? `${c.streetNumber.trim()} ` : ""}${c.street.trim()}`
    : "";
  return [street, c?.city?.trim()].filter(Boolean).join(", ") || l.address?.trim() || "";
};

/** Whether a location has any opening hours worth showing (mirrors the source microsite's hours gate). */
export const hasOpeningHours = (l: LocationWithAssignments): boolean => {
  const wh = (l.workingHours ?? {}) as Partial<Record<DayKey, { isOpen?: boolean }>>;
  return !!l.open247 || DAY_KEYS.some((d) => wh[d]?.isOpen);
};

/** Dialable tel: href — keeps a leading + (E.164) and drops visual separators. */
export const telHref = (phone: string): string => `tel:${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}`;

/** Platform-aware "show this place on the map" link. Uses the SEARCH endpoint (a pinned place card), never
 *  directions — a directions link has to invent an `origin`, which defaults to the device location and is
 *  unreliable on desktop (IP geolocation), so the route's start point comes out wrong. With search, the user
 *  taps Directions from the card where Maps uses their real location. On Apple devices `ll`+`q` pins the exact
 *  coords AND labels them with the business name; Google can't label bare coords without a Place ID (and
 *  discourages coordinate queries), so it gets the address string. Null when no usable location.
 *  https://developers.google.com/maps/documentation/urls/get-started */
const isApplePlatform = (): boolean =>
  typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

export const mapHref = (l: LocationWithAssignments): string | null => {
  const c = l.addressComponents;
  const coords = typeof c?.latitude === "number" && typeof c?.longitude === "number" ? `${c.latitude},${c.longitude}` : "";
  const addr = l.address?.trim();
  if (isApplePlatform()) {
    if (coords) return `https://maps.apple.com/?ll=${coords}&q=${encodeURIComponent(l.name)}`;
    if (addr) return `https://maps.apple.com/?q=${encodeURIComponent(addr)}`;
    return null;
  }
  if (addr) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  if (coords) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
  return null;
};

/** City/area line for a location — prefers the structured city, falls back to the address head. */
export const locationArea = (l: LocationWithAssignments): string =>
  l.addressComponents?.city?.trim() || l.address?.split(",")[0]?.trim() || "";

/** Featured photo for a location — the featured image, else the first portfolio image, else none. */
export const locationPhoto = (l: LocationWithAssignments): string | null =>
  l.featuredImage || l.portfolioImages?.[0]?.url || null;

/** Open/closed state for "today" (local device time), derived from the structured workingHours + open247.
 *  Mirrors the source microsite's `mcOpenStatus` but reads the codebase's structured hours (open/close
 *  "HH:MM") rather than parsing display strings. Only today is considered (the source shows no "opens
 *  tomorrow"); minutes-of-day comparison. */
export type OpenState =
  | { open: true; until: string | null } // open now; `until` = today's close, null when open247
  | { open: false; opensAt: string | null }; // closed now; `opensAt` = today's open if still ahead, else null

const parseMinutes = (t: string): number | null => {
  const m = /^\s*(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  return h >= 0 && h < 24 && min >= 0 && min < 60 ? h * 60 + min : null;
};

export function openNowStatus(l: LocationWithAssignments, now: Date = new Date()): OpenState {
  if (l.open247) return { open: true, until: null };
  const wh = (l.workingHours ?? {}) as Partial<Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>>;
  const day = wh[DAY_KEYS[(now.getDay() + 6) % 7]];
  if (!day?.isOpen || !day.open || !day.close) return { open: false, opensAt: null };
  const start = parseMinutes(day.open);
  const end = parseMinutes(day.close);
  if (start == null || end == null) return { open: false, opensAt: null };
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < start) return { open: false, opensAt: day.open };
  if (mins < end) return { open: true, until: day.close };
  return { open: false, opensAt: null };
}
