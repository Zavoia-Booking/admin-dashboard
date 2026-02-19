/**
 * Appointment block colors — respects Calendar Settings "Appointment color coding"
 * (By Status / By Service / By Staff). Uses pastel palette consistent with service categories.
 */
import { getColorHex, getReadableTextColor } from "../../shared/utils/color.ts";
import type { ColorCoding } from "./calendarPreferences.ts";

/** Minimal appointment shape needed for color resolution. */
export interface AppointmentColorInput {
    status: string;
    bookedItemName: string;
    staffUserIds: number[];
}

/** Pastel hex palette for status mode (aligned with Tailwind 300-style pastels). */
const STATUS_PASTEL_HEX: Record<string, string> = {
    confirmed: "#93c5fd",
    pending: "#c4b5fd",
    completed: "#86efac",
    no_show: "#f9a8d4",
    cancelled: "#d1d5db",
};

const DEFAULT_STATUS_HEX = "#fde047";

/**
 * Returns background and text color for an appointment block/chip based on
 * the current "Appointment color coding" setting.
 */
export function getAppointmentBlockColors(
    appointment: AppointmentColorInput,
    colorCoding: ColorCoding
): { backgroundColor: string; color: string } {
    let backgroundColor: string;

    switch (colorCoding) {
        case "status":
            backgroundColor = STATUS_PASTEL_HEX[appointment.status] ?? DEFAULT_STATUS_HEX;
            break;
        case "service":
            backgroundColor = getColorHex(appointment.bookedItemName);
            break;
        case "staff":
            const staffSeed = appointment.staffUserIds[0] ?? "unassigned";
            backgroundColor = getColorHex(String(staffSeed));
            break;
        default:
            backgroundColor = STATUS_PASTEL_HEX[appointment.status] ?? DEFAULT_STATUS_HEX;
    }

    return {
        backgroundColor,
        color: getReadableTextColor(backgroundColor),
    };
}
