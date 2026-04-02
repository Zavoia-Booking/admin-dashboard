import type { ReactElement } from "react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import { cn } from "../../../shared/lib/utils";
import type { CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { calendarPreferences } from "../calendarPreferences.ts";

/** Shown when an appointment has no customer name; booking channel is in “Booked via …”. */
export const NO_CUSTOMER_DISPLAY_LABEL = "No customer data";

/** Human label for API bookingSource (admin, phone, walk_in, marketplace). */
export function getBookingSourceLabel(source: string | null | undefined): string {
  if (source == null || source === '') return '—';
  const map: Record<string, string> = {
    admin: 'Admin',
    phone: 'Phone',
    walk_in: 'Walk-in',
    marketplace: 'Marketplace',
  };
  return map[source] ?? source;
}

/** Phrase inside the edit-appointment booking pill (no separate “Booking source” label). */
export function getBookedViaLabel(source: string | null | undefined): string {
  if (source == null || source === '') return 'Booked via —';
  const map: Record<string, string> = {
    admin: 'Booked via admin',
    phone: 'Booked via phone',
    walk_in: 'Booked via walk in',
    marketplace: 'Booked via marketplace',
  };
  return map[source] ?? `Booked via ${String(source).replace(/_/g, ' ')}`;
}

/**
 * Pill shell matching assignments flow (LocationServicesSection, etc.):
 * rounded-full, border, dot + label with gap-1.5.
 */
/** Exported for calendar UI pills that should match assignments (dot + label). */
export const assignmentStylePillLayout =
  'text-xs min-w-24 px-3 py-1 rounded-full font-medium flex items-center gap-1.5 shrink-0 border shadow-none';

/** Booking source chip: container + dot colors (assignments-style bullet pills). */
export function getBookingSourcePillParts(source: string | null | undefined): {
  badgeClass: string;
  dotClass: string;
} {
  if (source == null || source === '') {
    return {
      badgeClass: cn(
        assignmentStylePillLayout,
        'border-border bg-muted/60 text-foreground-2 dark:bg-muted/40',
      ),
      dotClass: 'h-2 w-2 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500',
    };
  }
  const map: Record<string, { badge: string; dot: string }> = {
    admin: {
      badge:
        'border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/45 dark:text-indigo-200',
      dot: 'bg-indigo-500',
    },
    phone: {
      badge:
        'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
      dot: 'bg-sky-500',
    },
    walk_in: {
      badge:
        'border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200',
      dot: 'bg-orange-500',
    },
    marketplace: {
      badge:
        'border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
      dot: 'bg-purple-500',
    },
  };
  const row = map[source] ?? {
    badge:
      'border-border-strong bg-muted/70 text-foreground-2 hover:bg-muted/80 dark:bg-muted/40',
    dot: 'bg-neutral-500',
  };
  return {
    badgeClass: cn(assignmentStylePillLayout, row.badge),
    dotClass: cn('h-2 w-2 shrink-0 rounded-full', row.dot),
  };
}

export const getStatusBadge = (status: string): ReactElement => {
  const dot = (cls: string) => (
    <div className={cn('h-2 w-2 shrink-0 rounded-full', cls)} aria-hidden />
  );
  switch (status) {
    case 'confirmed':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/25 dark:text-blue-400',
          )}
        >
          {dot('bg-blue-500')}
          Confirmed
        </Badge>
      );
    case 'completed':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-green-200 bg-green-50 text-green-900 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
          )}
        >
          {dot('bg-green-500')}
          Completed
        </Badge>
      );
    case 'no_show':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-red-200 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40',
          )}
        >
          {dot('bg-red-500')}
          No-show
        </Badge>
      );
    case 'pending':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400',
          )}
        >
          {dot('bg-orange-500')}
          Pending
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:border-destructive/35 dark:border-destructive/40 dark:bg-destructive/10 dark:text-destructive dark:hover:bg-destructive/15 dark:hover:border-destructive/50',
          )}
        >
          {dot('bg-destructive')}
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={cn(assignmentStylePillLayout, 'border-border')}>
          {dot('bg-neutral-400')}
          {status}
        </Badge>
      );
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

/** Human-readable duration e.g. 3h 45m, 45m, 2h. */
export function formatDurationHuman(totalMinutes: number): string {
    if (totalMinutes <= 0) return '—';
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

const STATUS_OVERVIEW: Record<string, string> = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No-show',
    pending: 'Pending',
};

export function getStatusOverviewLabel(status: string): string {
    return STATUS_OVERVIEW[status] ?? status.replace(/_/g, ' ');
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
};