// Helper functions to get date ranges based on selected date
import { AppointmentViewMode, type CalendarFilters } from "./types.ts";
import type { Appointment } from "../../shared/types/calendar.ts";
import { ALL } from "../../shared/constants.ts";

export const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    return weekStart;
};

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


export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getWeekDays = (currentWeekStart: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return date;
    });
};

export const STATUS_LIST = [
    { value: 'all', label: 'All statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'no-show', label: 'No Show' }
];


export const DEFAULT_FILTERS: CalendarFilters = {
    location: ALL,
    teamMember: ALL,
    service: ALL,
    status: ALL,
    clientName: '',
    email: '',
    phoneNumber: '',
    selectedDate: new Date(),
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(new Date().setHours(23, 59, 59, 0))
}

export const getDefaultCalendarFilters  = (): CalendarFilters => {
    return {
        location: ALL,
        teamMember: ALL,
        service: ALL,
        status: ALL,
        clientName: '',
        email: '',
        phoneNumber: '',
        selectedDate: new Date(),
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(new Date().setHours(23, 59, 59, 0))
    }
}
export const getStartOfTheWeek = (): Date => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
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


export const geTabItemInfo = (viewMode: AppointmentViewMode, selectedDate:Date, item:Date) => {
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

export const getFilterPayload = (filters: CalendarFilters): Record<string, number|string> => {

    const { location, service,teamMember, status,
        clientName, email, phoneNumber } = filters;
    const payload: Record<string, number|string> = {}

    if (location !== ALL && !!location) {
        payload.locationId = location;
    }

    if (service !== ALL && !!service) {
        payload.serviceId = service;
    }

    if (teamMember !== ALL && !!teamMember) {
        payload.teamMember = teamMember;
    }

    if (status !== ALL && !!status) {
        payload.status = status;
    }

    if (clientName) {
        payload.clientName = clientName;
    }

    if (email) {
        payload.clientEmail = email;
    }

    if (phoneNumber) {
        payload.clientPhone = phoneNumber;
    }


    return payload;
}

export const mapToAppointmentList = (list: Array<any>): Array<Appointment> => {
    return list.map((item: any) => {
        const { id, customer, teamMembers, service, location,
            scheduledAt, endsAt, status, notes, price, cancellationReason, createdAt, updatedAt,
        } = item;

        return {
            id,
            customer,
            teamMembers,
            service,
            location,
            scheduledAt,
            endsAt,
            status,
            notes,
            price,
            cancellationReason,
            createdAt,
            updatedAt,
        }
    })
}