/**
 * Appointment block colors — respects Calendar Settings "Appointment color coding"
 * (By Status / By Service / By Staff).
 *
 * Status backgrounds use semantic tokens from `src/shared/styles/globals.css`
 * (--info-bg, --success-bg, --warning-bg, --error-bg, --surface-active) so theme
 * changes stay single-sourced. Labels on those blocks use --text-primary.
 */
import { getColorHex, getReadableTextColor, hslToHex } from "../../shared/utils/color.ts";
import { getAvatarBgColor } from "../setupWizard/components/StepTeam";
import type { ColorCoding } from "./calendarPreferences.ts";

/** Minimal appointment shape needed for color resolution. */
export interface AppointmentColorInput {
    status: string;
    bookedItemName: string;
    staffUserIds: number[];
}

/** Background + label color for one appointment block (service/staff map values).
 *  `stripeColor` is a vivid, darker sibling of `backgroundColor` used by callers
 *  that render a colored left stripe (e.g. the mobile timeline card). */
export type AppointmentBlockColorPair = {
    backgroundColor: string;
    color: string;
    stripeColor: string;
};

/** Offset on the hue wheel so the first bucket is not always pure red. */
const CALENDAR_PALETTE_HUE_OFFSET = 27;
/** Slightly lower lightness than avatar pastels so adjacent hues read as different blocks. */
const CALENDAR_BLOCK_SAT_PCT = 62;
const CALENDAR_BLOCK_LIGHT_PCT = 84;

function hueToBlockHex(hue: number): string {
    const h = Math.round(((hue % 360) + 360) % 360);
    return hslToHex(`hsl(${h} ${CALENDAR_BLOCK_SAT_PCT}% ${CALENDAR_BLOCK_LIGHT_PCT}%)`);
}

/** Same hue as {@link hueToBlockHex} but saturated and mid-dark — the accent
 *  stripe that reads as the "identity" color of an appointment card. */
function hueToStripeHex(hue: number): string {
    const h = Math.round(((hue % 360) + 360) % 360);
    return hslToHex(`hsl(${h} 70% 42%)`);
}

/** Stripe companion for a hash-derived pastel (service/staff legacy fallback).
 *  Re-uses `getAvatarBgColor` so the stripe shares the card's hue. */
function getStripeHexFromName(name: string | undefined): string {
    const hsl = getAvatarBgColor(name);
    const match = hsl.match(/hsl\((\d+)/);
    const hue = match ? Number(match[1]) : 0;
    return hueToStripeHex(hue);
}

/**
 * Builds evenly spaced hues for all distinct services or staff keys in the given slice.
 * Pass the result into {@link getAppointmentBlockColors} so list/grid colors stay distinct.
 * Returns `null` for `status` coding or when no keys can be derived.
 *
 * @param knownKeys - Seed keys that always occupy a slot on the hue wheel regardless of
 *   whether the current appointments reference them. For "staff" mode pass all visible staff
 *   IDs (as strings); for "service" mode pass all location service names. This keeps hue
 *   assignments stable when navigating between days with different appointment mixes.
 */
export function buildCalendarColorMap(
    appointments: readonly AppointmentColorInput[],
    colorCoding: ColorCoding,
    knownKeys?: readonly (string | number)[],
): Map<string, AppointmentBlockColorPair> | null {
    if (colorCoding === "status") {
        return null;
    }

    const keys = new Set<string>();

    if (knownKeys) {
        for (const k of knownKeys) keys.add(String(k));
    }

    if (colorCoding === "service") {
        for (const a of appointments) {
            keys.add((a.bookedItemName ?? "").trim());
        }
        if (keys.size === 0) return null;
        const sorted = Array.from(keys).sort((x, y) => x.localeCompare(y));
        return buildHueMap(sorted);
    }

    if (colorCoding === "staff") {
        for (const a of appointments) {
            const id = a.staffUserIds?.[0];
            keys.add(id != null ? String(id) : "unassigned");
        }
        if (keys.size === 0) return null;
        const sorted = Array.from(keys).sort((a, b) => {
            if (a === "unassigned") return 1;
            if (b === "unassigned") return -1;
            return Number(a) - Number(b);
        });
        return buildHueMap(sorted);
    }

    return null;
}

function buildHueMap(sortedKeys: string[]): Map<string, AppointmentBlockColorPair> {
    const map = new Map<string, AppointmentBlockColorPair>();
    const step = 360 / sortedKeys.length;
    sortedKeys.forEach((key, index) => {
        const hue = index * step + CALENDAR_PALETTE_HUE_OFFSET;
        const backgroundColor = hueToBlockHex(hue);
        map.set(key, {
            backgroundColor,
            color: getReadableTextColor(backgroundColor),
            stripeColor: hueToStripeHex(hue),
        });
    });
    return map;
}

/**
 * CSS `var(--…)` background for status color-coding (confirmed / pending / completed / no_show / cancelled).
 * Aligned with CALENDAR_IMPLEMENTATION_LOG: info / warning / success / error / neutral.
 */
const STATUS_BACKGROUND_VAR: Record<string, string> = {
    confirmed: "var(--info-bg)",
    pending: "var(--warning-bg)",
    completed: "var(--success-bg)",
    no_show: "var(--error-bg)",
    cancelled: "var(--error-bg)",
};

/** Vivid companion for each status — the "identity" color for the left stripe.
 *  Maps directly to the `--*` semantic tokens (600-scale) that pair with the
 *  `--*-bg` pastel tokens used for {@link STATUS_BACKGROUND_VAR}.
 *
 *  Exception: `--success` is authored with very low chroma (~0.04), which reads
 *  as dark gray-green on a thin stripe. We override with a properly saturated
 *  green at the same lightness as the other status companions so the stripe
 *  family stays consistent. */
const STATUS_STRIPE_VAR: Record<string, string> = {
    confirmed: "var(--info)",
    pending: "var(--warning)",
    completed: "oklch(62% 0.17 150)",
    no_show: "var(--error)",
    cancelled: "var(--error)",
};

const DEFAULT_STATUS_BACKGROUND = "var(--warning-bg)";
const DEFAULT_STATUS_STRIPE = "var(--warning)";

/** Background for a given API appointment status when coding by status (grid + filter pills). */
export function getStatusPastelBackground(status: string): string {
    return STATUS_BACKGROUND_VAR[status] ?? DEFAULT_STATUS_BACKGROUND;
}

/** Vivid left-stripe color paired with {@link getStatusPastelBackground}. */
export function getStatusStripeColor(status: string): string {
    return STATUS_STRIPE_VAR[status] ?? DEFAULT_STATUS_STRIPE;
}

/** Foreground for text on top of {@link getStatusPastelBackground} (light or dark theme). */
export function getStatusForegroundColor(): string {
    return "var(--text-primary)";
}

/** Colored dot inside the status filter pill (left circle), aligned with status semantics. */
const STATUS_FILTER_INDICATOR_DOT: Record<string, string> = {
    confirmed: "bg-sky-500",
    pending: "bg-amber-500",
    completed: "bg-green-500",
    no_show: "bg-red-500",
    cancelled: "bg-destructive",
};

export function getStatusFilterIndicatorDotClass(status: string): string {
    return STATUS_FILTER_INDICATOR_DOT[status] ?? "bg-amber-500";
}

/**
 * Avatar background color for a staff member.
 * When color coding is "staff" and a colorMap is provided, returns the same color
 * used on appointment cards so avatars and cards visually match.
 * Falls back to the hash-based `getAvatarBgColor` otherwise.
 */
export function getStaffAvatarColor(
    staffId: number,
    avatarFallbackKey: string,
    colorMap?: Map<string, AppointmentBlockColorPair> | null,
): string {
    const mapped = colorMap?.get(String(staffId));
    if (mapped) return mapped.backgroundColor;
    return getAvatarBgColor(avatarFallbackKey);
}

/**
 * Returns background and text color for an appointment block/chip based on
 * the current "Appointment color coding" setting.
 *
 * When `colorMap` is provided (from {@link buildCalendarColorMap}), service/staff modes use
 * evenly spaced hues; otherwise the legacy string-hash palette is used.
 */
export function getAppointmentBlockColors(
    appointment: AppointmentColorInput,
    colorCoding: ColorCoding,
    colorMap?: Map<string, AppointmentBlockColorPair> | null,
): AppointmentBlockColorPair {
    // Cancelled appointments always read as cancelled regardless of color-coding
    // mode — the hue/service/staff hue would otherwise hide that the booking is
    // off the calendar.
    if (appointment.status === "cancelled") {
        return {
            backgroundColor: getStatusPastelBackground("cancelled"),
            color: getStatusForegroundColor(),
            stripeColor: getStatusStripeColor("cancelled"),
        };
    }
    switch (colorCoding) {
        case "status":
            return {
                backgroundColor: getStatusPastelBackground(appointment.status),
                color: getStatusForegroundColor(),
                stripeColor: getStatusStripeColor(appointment.status),
            };
        case "service": {
            const serviceKey = (appointment.bookedItemName ?? "").trim();
            const mapped = colorMap?.get(serviceKey);
            if (mapped) return mapped;
            const backgroundColor = getColorHex(appointment.bookedItemName);
            return {
                backgroundColor,
                color: getReadableTextColor(backgroundColor),
                stripeColor: getStripeHexFromName(appointment.bookedItemName),
            };
        }
        case "staff": {
            const staffKey =
                appointment.staffUserIds[0] != null
                    ? String(appointment.staffUserIds[0])
                    : "unassigned";
            const mapped = colorMap?.get(staffKey);
            if (mapped) return mapped;
            const backgroundColor = getColorHex(staffKey);
            return {
                backgroundColor,
                color: getReadableTextColor(backgroundColor),
                stripeColor: getStripeHexFromName(staffKey),
            };
        }
        default:
            return {
                backgroundColor: getStatusPastelBackground(appointment.status),
                color: getStatusForegroundColor(),
                stripeColor: getStatusStripeColor(appointment.status),
            };
    }
}
