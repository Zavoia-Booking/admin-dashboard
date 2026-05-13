import type { ReactElement } from "react";
import type { TFunction } from "i18next";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import { cn } from "../../../shared/lib/utils";
import type { CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { calendarPreferences } from "../calendarPreferences.ts";
import { getCalendarLocale } from "../timezone.ts";

/** i18n-aware customer display fallback. Pass `t` from useTranslation('calendar'). */
export function getNoCustomerDisplayLabel(t: TFunction): string {
  return t("page.common.noCustomerData");
}

/** Human label for API bookingSource (admin, phone, walk_in, marketplace). */
export function getBookingSourceLabel(source: string | null | undefined, t: TFunction): string {
  if (source == null || source === '') return '—';
  const map: Record<string, string> = {
    admin: t("page.common.bookingSources.admin"),
    phone: t("page.common.bookingSources.phone"),
    walk_in: t("page.common.bookingSources.walkIn"),
    marketplace: t("page.common.bookingSources.marketplace"),
  };
  return map[source] ?? source;
}

/** Phrase inside the edit-appointment booking pill (no separate "Booking source" label). */
export function getBookedViaLabel(source: string | null | undefined, t: TFunction): string {
  if (source == null || source === '') return t("page.common.bookedVia.empty");
  const map: Record<string, string> = {
    admin: t("page.common.bookedVia.admin"),
    phone: t("page.common.bookedVia.phone"),
    walk_in: t("page.common.bookedVia.walkIn"),
    marketplace: t("page.common.bookedVia.marketplace"),
  };
  return map[source] ?? t("page.common.bookedVia.generic", { source: String(source).replace(/_/g, ' ') });
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
        'border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100',
      dot: 'bg-indigo-500',
    },
    phone: {
      badge:
        'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100',
      dot: 'bg-sky-500',
    },
    walk_in: {
      badge:
        'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10',
      dot: 'bg-primary',
    },
    marketplace: {
      badge:
        'border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100',
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

export const getStatusBadge = (status: string, t: TFunction): ReactElement => {
  const dot = (cls: string) => (
    <div className={cn('h-2 w-2 shrink-0 rounded-full', cls)} aria-hidden />
  );
  const labels: Record<string, string> = {
    confirmed: t("page.common.statuses.confirmed"),
    completed: t("page.common.statuses.completed"),
    no_show: t("page.common.statuses.noShow"),
    pending: t("page.common.statuses.pending"),
    cancelled: t("page.common.statuses.cancelled"),
  };
  switch (status) {
    case 'confirmed':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100',
          )}
        >
          {dot('bg-blue-500')}
          {labels.confirmed}
        </Badge>
      );
    case 'completed':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-green-200 bg-green-50 text-green-900 hover:bg-green-100',
          )}
        >
          {dot('bg-green-500')}
          {labels.completed}
        </Badge>
      );
    case 'no_show':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-red-200 bg-red-50 text-red-900 hover:bg-red-100',
          )}
        >
          {dot('bg-red-500')}
          {labels.no_show}
        </Badge>
      );
    case 'pending':
      return (
        <Badge
          className={cn(
            assignmentStylePillLayout,
            'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10',
          )}
        >
          {dot('bg-primary')}
          {labels.pending}
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
          {labels.cancelled}
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

/** Text-only status label color (no pill background). */
export const getStatusLabelClass = (status: string): string => {
    switch (status) {
        case 'confirmed': return 'text-blue-700 dark:text-blue-400';
        case 'completed': return 'text-green-700 dark:text-green-400';
        case 'no_show':   return 'text-red-700 dark:text-red-300';
        case 'pending':   return 'text-primary';
        case 'cancelled': return 'text-destructive';
        default:          return 'text-muted-foreground';
    }
};

/** Tailwind dot class for status row indicator. */
export const getStatusDotClass = (status: string): string => {
    switch (status) {
        case 'confirmed': return 'bg-blue-500';
        case 'completed': return 'bg-green-500';
        case 'no_show':   return 'bg-red-500';
        case 'pending':   return 'bg-primary';
        case 'cancelled': return 'bg-destructive';
        default:          return 'bg-neutral-400';
    }
};

/** Text-only status label (translated). */
export const getStatusLabelText = (status: string, t: TFunction): string => {
    const map: Record<string, string> = {
        confirmed: t('page.common.statuses.confirmed'),
        completed: t('page.common.statuses.completed'),
        no_show: t('page.common.statuses.noShow'),
        pending: t('page.common.statuses.pending'),
        cancelled: t('page.common.statuses.cancelled'),
    };
    return map[status] ?? status;
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
    return date.toLocaleTimeString(getCalendarLocale(), {
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

/** Human-readable duration e.g. 3h 45min, 45min, 2h. */
export function formatDurationHuman(totalMinutes: number, t: TFunction): string {
    if (totalMinutes <= 0) return '—';
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    const hUnit = t('common:units.hourShort');
    const mUnit = t('common:units.minuteShort');
    if (h === 0) return `${m}${mUnit}`;
    if (m === 0) return `${h}${hUnit}`;
    return `${h}${hUnit} ${m}${mUnit}`;
}

/** Compact duration for mobile card left column: 30min, 1h, 1h30min. */
export function formatDurationCompact(totalMinutes: number, t: TFunction): string {
    if (totalMinutes <= 0) return '—';
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    const hUnit = t('common:units.hourShort');
    const mUnit = t('common:units.minuteShort');
    if (h === 0) return `${m}${mUnit}`;
    if (m === 0) return `${h}${hUnit}`;
    return `${h}${hUnit}${m}${mUnit}`;
}

/** Split formatted time into `clock` and optional `meridiem` (null for 24h). */
export const formatClockAndMeridiem = (
    isoDate: string,
    timezone?: string,
): { clock: string; meridiem: string | null } => {
    const hour12 = calendarPreferences.getTimeFormat() === '12h';
    const date = new Date(isoDate);
    const formatted = date.toLocaleTimeString(getCalendarLocale(), {
        hour: 'numeric',
        minute: '2-digit',
        hour12,
        ...(timezone ? { timeZone: timezone } : {}),
    });
    if (!hour12) return { clock: formatted, meridiem: null };
    const match = formatted.match(/^(.*?)[\s\u00a0]+([AP]M|am|pm|a\.m\.|p\.m\.)$/i);
    if (match) {
        return { clock: match[1].trim(), meridiem: match[2].toUpperCase().replace(/\./g, '') };
    }
    return { clock: formatted, meridiem: null };
};

export function getStatusOverviewLabel(status: string, t: TFunction): string {
    const map: Record<string, string> = {
        confirmed: t("page.common.statuses.confirmed"),
        completed: t("page.common.statuses.completed"),
        cancelled: t("page.common.statuses.cancelled"),
        no_show: t("page.common.statuses.noShow"),
        pending: t("page.common.statuses.pending"),
    };
    return map[status] ?? status.replace(/_/g, ' ');
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
    return d.toLocaleTimeString(getCalendarLocale(), {
        hour: 'numeric',
        minute: '2-digit',
        hour12,
    });
}

/**
 * Resolve staff user IDs to display names using the location staff list.
 * Returns "Unassigned" if no staff assigned.
 */
export const getStaffDisplayNames = (staffUserIds: number[], locationStaff: CalendarStaffMember[], t: TFunction): string => {
    if (staffUserIds.length === 0) return t("page.common.unassigned");

    const names = staffUserIds.map(id => {
        const staff = locationStaff.find(s => s.id === id);
        return staff ? `${staff.firstName} ${staff.lastName}` : t("page.common.staffId", { id });
    });

    return names.join(', ');
}

/**
 * Get display name for a single staff user ID, or "Unassigned" if null/not found.
 * Used in AddAppointmentSlider staff trigger.
 */
export const getStaffDisplayNameOrUnassigned = (
    staffUserId: number | null,
    locationStaff: CalendarStaffMember[],
    t: TFunction,
): string => {
    if (staffUserId == null) return t("page.common.unassigned");
    const staff = locationStaff.find(s => s.id === staffUserId);
    return staff ? `${staff.firstName} ${staff.lastName}` : t("page.common.unknown");
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