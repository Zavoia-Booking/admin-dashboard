import type { ReactElement } from "react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import type { CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { calendarPreferences } from "../calendarPreferences.ts";

export const getStatusBadge = (status: string): ReactElement => {
    switch (status) {
        case 'confirmed':
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">Confirmed</Badge>;
        case 'completed':
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>;
        case 'no_show':
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">No Show</Badge>;
        case 'pending':
            return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400">Pending</Badge>;
        case 'cancelled':
            return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400">Cancelled</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export const findItemByKey = (list: Array<any>, key: string, value: string | number) => {
    return list.find(item => {
        return `${item[key]}` === `${value}`
    })
}

/**
 * Format a time string from an ISO date string.
 * Uses calendar preference (12h / 24h) from Calendar Settings.
 */
export const formatTime = (isoDate: string, timezone?: string): string => {
    const date = new Date(isoDate);
    const hour12 = calendarPreferences.getTimeFormat() === '12h';
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12,
        ...(timezone ? { timeZone: timezone } : {}),
    });
}

/**
 * Format a time range from two ISO date strings.
 * Uses calendar preference (12h / 24h).
 */
export const formatTimeRange = (startIso: string, endIso: string, timezone?: string): string => {
    return `${formatTime(startIso, timezone)} - ${formatTime(endIso, timezone)}`;
}

/**
 * Format ISO date-time into stable 24h "HH:mm" key for slot matching.
 */
export const formatTimeKey = (isoDate: string, timezone: string): string => {
    return new Date(isoDate).toLocaleTimeString('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

/**
 * Format a slot time string ("HH:mm") for display.
 * Uses calendar preference (12h / 24h) from Calendar Settings.
 * Used in Add Appointment and Block Time forms.
 */
export const formatSlotTime = (slot: string): string => {
    const [h, m] = slot.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    const hour12 = calendarPreferences.getTimeFormat() === '12h';
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12,
    });
}

/**
 * Resolve staff user IDs to display names using the location staff list.
 * Returns "Unassigned" if no staff assigned.
 */
export const getStaffDisplayNames = (staffUserIds: number[], locationStaff: CalendarStaffMember[]): string => {
    if (staffUserIds.length === 0) return 'Unassigned';

    const names = staffUserIds.map(id => {
        const staff = locationStaff.find(s => s.id === id);
        return staff ? `${staff.firstName} ${staff.lastName}` : `Staff #${id}`;
    });

    return names.join(', ');
}

/**
 * Get display name for a single staff user ID, or "Unassigned" if null/not found.
 * Used in AddAppointmentSlider staff trigger.
 */
export const getStaffDisplayNameOrUnassigned = (
    staffUserId: number | null,
    locationStaff: CalendarStaffMember[]
): string => {
    if (staffUserId == null) return 'Unassigned';
    const staff = locationStaff.find(s => s.id === staffUserId);
    return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
};

/**
 * Compute end time as "HH:mm" from start time "HH:mm" and duration in minutes.
 * Used for "Appointment: X – Y (Z min)" display in AddAppointmentSlider.
 */
export const getEndTimeString = (startTimeHHmm: string, durationMinutes: number): string => {
    const [h, m] = startTimeHHmm.split(':').map(Number);
    const totalM = (h ?? 0) * 60 + (m ?? 0) + durationMinutes;
    const eh = Math.floor(totalM / 60) % 24;
    const em = totalM % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

/**
 * Get a booking source display label.
 */
export const getBookingSourceLabel = (source: string): string => {
    switch (source) {
        case 'admin': return 'Admin';
        case 'marketplace': return 'Online';
        case 'phone': return 'Phone';
        case 'walk_in': return 'Walk-in';
        default: return source;
    }
}