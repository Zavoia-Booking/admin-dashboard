/**
 * Appointment block colors — respects Calendar Settings "Appointment color coding"
 * (By Status / By Service / By Staff).
 *
 * Status backgrounds use semantic tokens from `src/shared/styles/globals.css`
 * (--info-bg, --success-bg, --warning-bg, --error-bg, --surface-active) so theme
 * changes stay single-sourced. Labels on those blocks use --text-primary.
 */
import { getColorHex, getReadableTextColor } from "../../shared/utils/color.ts";
import type { ColorCoding } from "./calendarPreferences.ts";

/** Minimal appointment shape needed for color resolution. */
export interface AppointmentColorInput {
    status: string;
    bookedItemName: string;
    staffUserIds: number[];
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
 * Returns background and text color for an appointment block/chip based on
 * the current "Appointment color coding" setting.
 */
export function getAppointmentBlockColors(
    appointment: AppointmentColorInput,
    colorCoding: ColorCoding
): { backgroundColor: string; color: string } {
    let backgroundColor: string;
    let color: string;

    switch (colorCoding) {
        case "status":
            backgroundColor = getStatusPastelBackground(appointment.status);
            color = getStatusForegroundColor();
            break;
        case "service":
            backgroundColor = getColorHex(appointment.bookedItemName);
            color = getReadableTextColor(backgroundColor);
            break;
        case "staff": {
            const staffSeed = appointment.staffUserIds[0] ?? "unassigned";
            backgroundColor = getColorHex(String(staffSeed));
            color = getReadableTextColor(backgroundColor);
            break;
        }
        default:
            backgroundColor = getStatusPastelBackground(appointment.status);
            color = getStatusForegroundColor();
    }

    return { backgroundColor, color };
}
