import type { WebsiteBuilderLocation } from "../../../../types";

// Day keys for opening-hours rows, reused by the Locations stage and the Footer detail.
export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export const DAY_KEYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Pretty caption address — structured "street, city" (no postal code / country), falling back to the
 *  raw formatted address only when components are absent. */
export const prettyAddress = (l: WebsiteBuilderLocation): string => {
  const c = l.addressComponents;
  const street = c?.street?.trim()
    ? `${c.streetNumber?.trim() ? `${c.streetNumber.trim()} ` : ""}${c.street.trim()}`
    : "";
  return [street, c?.city?.trim()].filter(Boolean).join(", ") || l.address?.trim() || "";
};

/** Source-style location line: street/city plus the real structured postal code when it is not already present. */
export const locationPostalAddress = (l: WebsiteBuilderLocation): string => {
  const components = l.addressComponents;
  const street = components?.street?.trim()
    ? `${components.streetNumber?.trim() ? `${components.streetNumber.trim()} ` : ""}${components.street.trim()}`
    : "";
  const address = street
    ? [street, components?.city?.trim()].filter(Boolean).join(", ")
    : l.address?.trim() || components?.city?.trim() || "";
  const postalCode = l.addressComponents?.postalCode?.trim() ?? "";
  if (!postalCode || address.toLocaleLowerCase().includes(postalCode.toLocaleLowerCase())) {
    return address || postalCode;
  }
  return address ? `${address}, ${postalCode}` : postalCode;
};

/** Whether a location has opening hours worth showing. Locations can retain an explicit all-closed week;
 *  other existing consumers keep the former open-day-only gate by omitting `includeClosedSchedule`. */
export const hasOpeningHours = (
  l: WebsiteBuilderLocation,
  includeClosedSchedule = false,
): boolean => {
  const wh = (l.workingHours ?? {}) as Partial<Record<DayKey, { isOpen?: boolean }>>;
  return !!l.open247 || DAY_KEYS.some((d) => (includeClosedSchedule ? !!wh[d] : !!wh[d]?.isOpen));
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

export const mapHref = (l: WebsiteBuilderLocation): string | null => {
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

/** City/area line for a location. Without a dedicated area field, omit it rather than relabel a street. */
export const locationArea = (l: WebsiteBuilderLocation): string =>
  l.addressComponents?.city?.trim() || "";

/** Featured photo for a location — the featured image, else the first portfolio image, else none. */
export const locationPhoto = (l: WebsiteBuilderLocation): string | null =>
  l.featuredImage || l.portfolioImages?.[0]?.url || null;

/** Open/closed state for "today" in the location's timezone, derived from structured workingHours + open247.
 *  Mirrors the source microsite's `mcOpenStatus` but reads the codebase's structured hours (open/close
 *  "HH:MM") rather than parsing display strings. Only today is considered (the source shows no "opens
 *  tomorrow"); minutes-of-day comparison. */
export type OpenState =
  | { open: true; until: string | null } // open now; `until` = today's close, null when open247
  | { open: false; opensAt: string | null; phase: "before" | "closed" | "after" };

const parseMinutes = (t: string): number | null => {
  const m = /^\s*(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  return h >= 0 && h < 24 && min >= 0 && min < 60 ? h * 60 + min : null;
};

type LocationClock = { dayIndex: number; minutes: number };

/** Current weekday/minutes in the location's own timezone, with a device-local fallback for legacy data. */
export function locationClock(l: WebsiteBuilderLocation, now: Date = new Date()): LocationClock {
  if (l.timezone?.trim()) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: l.timezone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(now);
      const weekday = parts.find((part) => part.type === "weekday")?.value.toLowerCase().slice(0, 3);
      const hour = Number(parts.find((part) => part.type === "hour")?.value);
      const minute = Number(parts.find((part) => part.type === "minute")?.value);
      const dayIndex = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(weekday ?? "");
      if (dayIndex >= 0 && Number.isInteger(hour) && Number.isInteger(minute)) {
        return { dayIndex, minutes: hour * 60 + minute };
      }
    } catch {
      // Invalid/legacy timezone: keep the preview usable with the device-local clock.
    }
  }
  return { dayIndex: (now.getDay() + 6) % 7, minutes: now.getHours() * 60 + now.getMinutes() };
}

export function openNowStatus(l: WebsiteBuilderLocation, now: Date = new Date()): OpenState {
  if (l.open247) return { open: true, until: null };
  const wh = (l.workingHours ?? {}) as Partial<Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>>;
  const clock = locationClock(l, now);
  const day = wh[DAY_KEYS[clock.dayIndex]];
  if (!day?.isOpen || !day.open || !day.close) {
    return { open: false, opensAt: null, phase: "closed" };
  }
  const start = parseMinutes(day.open);
  const end = parseMinutes(day.close);
  if (start == null || end == null) return { open: false, opensAt: null, phase: "closed" };
  const mins = clock.minutes;
  if (mins < start) return { open: false, opensAt: day.open, phase: "before" };
  if (mins < end) return { open: true, until: day.close };
  return { open: false, opensAt: null, phase: "after" };
}
