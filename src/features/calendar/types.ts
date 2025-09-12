import type { Appointment } from "../../shared/types/calendar.ts";

export type CalendarViewState = {
    appointments: Array<Appointment>,
    addFormOpen: boolean,
    editForm: {
        open: boolean,
        item: Appointment | null
    },
    viewType: AppointmentViewType,
    viewMode: AppointmentViewMode,
    filters: CalendarFilters,
}

export enum AppointmentViewMode {
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    DAY = 'DAY',
}

export enum AppointmentViewType {
    LIST='LIST',
    GRID='GRID',
}

export type CalendarFilters = {
    location: string,
    teamMember: string,
    service: string,
    status: string,
    clientName: string,
    email: string,
    phoneNumber: string,
    startDate: Date,
    endDate: Date,
    selectedDate: Date
}