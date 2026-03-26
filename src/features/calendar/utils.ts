// Helper functions to get date ranges based on selected date
import { AppointmentViewMode } from "./types.ts";

/** Format a Date as YYYY-MM-DD using local date (avoids timezone shifting the calendar day). */
export const toLocalDateString = (d: Date): string => {
    const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/** Get Monday as start of week (Europe convention) */
export const getWeekStart = (date: Date) => {
    const day = date.getDay(); // 0=Sun, 1=Mon, ...
    // (day + 6) % 7 converts: Mon=0, Tue=1, ..., Sun=6
    const diff = (day + 6) % 7;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - diff);
    return weekStart;
};

/** Get Sunday as end of week (Mon–Sun) */
export const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
};

export const timeToMinutes = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalHours = hours;

    if (period === 'PM' && hours !== 12) {
        totalHours += 12;
    } else if (period === 'AM' && hours === 12) {
        totalHours = 0;
    }

    return totalHours * 60 + (minutes || 0);
};

export const convertTo24Hour = (time12h: string): string => {
    if (!time12h) {
        return '00:00';
    }
    const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return time12h;

    let hour = parseInt( match[1], 10);
    const m = match[2];
    const period = match[3];

    if (period) {
        if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
        if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    }
    return `${String(hour).padStart(2, '0')}:${m}`;
}


export const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const getWeekDays = (currentWeekStart: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return date;
    });
};

export const STATUS_LIST = [
    { value: 'all', label: 'Any status' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'no_show', label: 'No-show' },
    { value: 'cancelled', label: 'Cancelled' },
];


export const getStartOfTheWeek = (): Date => {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sun, 1=Mon, ...
    const diff = (currentDay + 6) % 7; // Mon=0
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diff);
    return startOfWeek;
}

export const getMonths = (selectedDate: Date): Array<Date> => {
    return Array.from({ length: 7 }, (_, i) => {
        const month = new Date(selectedDate);
        month.setMonth(selectedDate.getMonth() + (i - 3));
        month.setDate(1);
        return month;
    });
};

export const getWeeksList = (currentWeekStart: Date): Array<Date> => {
    return Array.from({ length: 7 }, (_, i) => {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(currentWeekStart.getDate() + (i - 3) * 7);
        return weekStart;
    });
};

export const getDaysList = (currentWeekStart: Date): Array<Date> => {
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return date;
    });
}

export const getViewItemList = (viewMode:AppointmentViewMode, currentWeekStart: Date): Array<Date> => {
    switch (viewMode) {
        case AppointmentViewMode.DAY:
            return getDaysList(currentWeekStart);
        case AppointmentViewMode.WEEK:
            return getWeeksList(currentWeekStart);
        case AppointmentViewMode.MONTH:
            return getMonths(currentWeekStart);
        default:
            return getDaysList(currentWeekStart);
    }
};


export const getTabItemInfo = (viewMode: AppointmentViewMode, selectedDate:Date, item:Date) => {
    let isSelected = false;
    let displayText = '';
    let subText = '';


    if (viewMode === AppointmentViewMode.DAY) {
        isSelected = item.toDateString() === selectedDate.toDateString();
        displayText = dayNames[item.getDay()];
        subText = item.getDate().toString();
    }

    if (viewMode === AppointmentViewMode.WEEK) {
        const weekEnd = new Date(item);
        weekEnd.setDate(item.getDate() + 6);

        // Check if selectedDate falls within this week range
        isSelected = selectedDate >= item && selectedDate <= weekEnd;

        // Format week range display
        const startMonth = item.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
        const startDay = item.getDate();
        const endDay = weekEnd.getDate();

        if (startMonth === endMonth) {
            // Same month: "Jan 6-12"
            displayText = startMonth;
            subText = `${startDay}-${endDay}`;
        } else {
            // Different months: "Jan 30-Feb 5"
            displayText = `${startMonth} ${startDay}-`;
            subText = `${endMonth} ${endDay}`;
        }
    }

    if (viewMode === AppointmentViewMode.MONTH) {
        isSelected = item.getMonth() === selectedDate.getMonth() && item.getFullYear() === selectedDate.getFullYear();
        displayText = item.toLocaleDateString('en-US', { month: 'short' });
        subText = item.getFullYear().toString();
    }

    return {
        isSelected,
        displayText,
        subText
    }
}

export const getStartEndDate = (date: Date): {startDate: Date, endDate: Date} => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 1, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 0);

    return {
        startDate: startOfDay,
        endDate: endOfDay
    }
}

export const getWeekRange = (selectedDate: Date): {startDate: Date, endDate: Date} => {
    const date = new Date(selectedDate);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate difference to Monday (treat Sunday as 7)
    const diff = (day + 6) % 7;

    // Start of week (Monday)
    const start = new Date(date);
    start.setDate(date.getDate() - diff);
    start.setHours(0, 0, 1, 0);

    // End of week (Sunday)
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(0, 0, 1, 0);

    return { startDate: start, endDate:end };
}

export const getMonthRange = (selectedDate: Date): {startDate: Date, endDate: Date} => {
    const date = new Date(selectedDate);

    // Start of month
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 1, 0);

    // End of month (day 0 of next month = last day of current month)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(0, 0, 1, 0);

    return { startDate: start, endDate:end };
}

/**
 * Given a selected date and view mode, returns the ISO date strings
 * for the start and end of the visible range.
 * Used by sagas to determine which date range to fetch from the API.
 * For MONTH view, pass monthViewStart (first day of displayed month) so prev/next don't use selectedDate's month.
 * For WEEK view, pass weekViewStart (Monday of displayed week) so prev/next don't change selectedDate.
 */
/** One cell in the month-view grid (includes leading/trailing days from adjacent months). */
export type MonthCalendarCell = { date: Date; isCurrentMonth: boolean };

/**
 * Builds the full month calendar grid (Mon-first weeks) for the displayed month.
 * Same shape as used by month summary UI — reuse for date keys and layout.
 */
export function buildMonthCalendarGridCells(
    monthViewDisplayStart: Date | null | undefined,
    selectedDate: Date,
): MonthCalendarCell[] {
    const base =
        monthViewDisplayStart ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    const lastDayOfWeek = (lastDay.getDay() + 6) % 7;
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDayOfWeek);
    const end = new Date(lastDay);
    end.setDate(lastDay.getDate() + (6 - lastDayOfWeek));

    const cells: MonthCalendarCell[] = [];
    const current = new Date(start);
    while (current <= end) {
        cells.push({
            date: new Date(current),
            isCurrentMonth: current.getMonth() === month,
        });
        current.setDate(current.getDate() + 1);
    }
    return cells;
}

export const getDateRangeForMode = (
    selectedDate: Date,
    viewMode: AppointmentViewMode,
    monthViewStart?: Date | null,
    weekViewStart?: Date | null
): { startDate: string; endDate: string } => {
    if (viewMode === AppointmentViewMode.DAY) {
        const dateStr = toLocalDateString(selectedDate);
        return { startDate: dateStr, endDate: dateStr };
    }

    if (viewMode === AppointmentViewMode.WEEK) {
        const ref = weekViewStart ?? getWeekStart(selectedDate);
        const { startDate, endDate } = getWeekRange(ref);
        return {
            startDate: toLocalDateString(startDate),
            endDate: toLocalDateString(endDate),
        };
    }

    // MONTH: use monthViewStart when provided (displayed month), else selectedDate
    const monthRef = monthViewStart ?? selectedDate;
    const { startDate, endDate } = getMonthRange(monthRef);
    return {
        startDate: toLocalDateString(startDate),
        endDate: toLocalDateString(endDate),
    };
}
