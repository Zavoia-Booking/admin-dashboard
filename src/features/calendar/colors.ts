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

/** Background + label color for one appointment block (service/staff map values). */
export type AppointmentBlockColorPair = { backgroundColor: string; color: string };

/** Offset on the hue wheel so the first bucket is not always pure red. */
const CALENDAR_PALETTE_HUE_OFFSET = 27;
/** Slightly lower lightness than avatar pastels so adjacent hues read as different blocks. */
const CALENDAR_BLOCK_SAT_PCT = 62;
const CALENDAR_BLOCK_LIGHT_PCT = 84;

function hueToBlockHex(hue: number): string {
    const h = Math.round(((hue % 360) + 360) % 360);
    return hslToHex(`hsl(${h} ${CALENDAR_BLOCK_SAT_PCT}% ${CALENDAR_BLOCK_LIGHT_PCT}%)`);
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
        map.set(key, { backgroundColor, color: getReadableTextColor(backgroundColor) });
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
    cancelled: "var(--surface-active)",
};

const DEFAULT_STATUS_BACKGROUND = "var(--warning-bg)";

/** Background for a given API appointment status when coding by status (grid + filter pills). */
export function getStatusPastelBackground(status: string): string {
    return STATUS_BACKGROUND_VAR[status] ?? DEFAULT_STATUS_BACKGROUND;
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
    cancelled: "bg-slate-500",
};

export function getStatusFilterIndicatorDotClass(status: string): string {
    return STATUS_FILTER_INDICATOR_DOT[status] ?? "bg-amber-500";
}

/**
 * Returns a deterministic, saturated HSL color for a booking group dot indicator.
 * Reuses the same hue as getAvatarBgColor (so same groupId → same family of color)
 * but at higher saturation + medium lightness so it's clearly visible as a small dot.
 */
export function getGroupDotColor(bookingGroupId: string): string {
    const hsl = getAvatarBgColor(bookingGroupId);
    const match = hsl.match(/hsl\((\d+)/);
    if (!match) return 'hsl(220 65% 55%)';
    return `hsl(${match[1]} 65% 52%)`;
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
    let backgroundColor: string;
    let color: string;

    switch (colorCoding) {
        case "status":
            backgroundColor = getStatusPastelBackground(appointment.status);
            color = getStatusForegroundColor();
            break;
        case "service": {
            const serviceKey = (appointment.bookedItemName ?? "").trim();
            const mapped = colorMap?.get(serviceKey);
            if (mapped) {
                return mapped;
            }
            backgroundColor = getColorHex(appointment.bookedItemName);
            color = getReadableTextColor(backgroundColor);
            break;
        }
        case "staff": {
            const staffKey =
                appointment.staffUserIds[0] != null
                    ? String(appointment.staffUserIds[0])
                    : "unassigned";
            const mapped = colorMap?.get(staffKey);
            if (mapped) {
                return mapped;
            }
            backgroundColor = getColorHex(String(appointment.staffUserIds[0] ?? "unassigned"));
            color = getReadableTextColor(backgroundColor);
            break;
        }
        default:
            backgroundColor = getStatusPastelBackground(appointment.status);
            color = getStatusForegroundColor();
    }

    return { backgroundColor, color };
}
