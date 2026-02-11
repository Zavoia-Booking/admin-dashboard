import type { ReactElement } from "react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import type { CalendarStaffMember } from "../../../shared/types/calendar.ts";

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
 * e.g. "2026-02-11T14:30:00Z" → "2:30 PM"
 */
export const formatTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format a time range from two ISO date strings.
 * e.g. "2:30 PM - 3:30 PM"
 */
export const formatTimeRange = (startIso: string, endIso: string): string => {
    return `${formatTime(startIso)} - ${formatTime(endIso)}`;
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