import * as actions from "./actions";
import { type ActionType, getType } from "typesafe-actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";
import { AppointmentViewMode, AppointmentViewType, type CalendarFilters, type CalendarViewState } from "./types.ts";
import type { Appointment } from "../../shared/types/calendar.ts";
import { getDefaultCalendarFilters } from "./utils.ts";

type Actions = ActionType<typeof actions>;

const initialState: CalendarViewState = {
    appointments: [],
    addFormOpen: false,
    editForm: {
        open: false,
        item: null,
    },
    viewType: AppointmentViewType.LIST,
    viewMode: AppointmentViewMode.DAY,
    filters: getDefaultCalendarFilters(),
};

export const handleOpenAddForm = (state: CalendarViewState, payload: boolean): CalendarViewState => {
    return {
        ... state,
        addFormOpen: payload,
    }
}

export const handleToggleEditForm = (state: CalendarViewState, payload: {open: boolean, item: Appointment | null}): CalendarViewState => {
    const { open, item } = payload;

    return {
        ... state,
        editForm: {
            open,
            item,
        },
    }
}

export const handleSetViewType = (state: CalendarViewState, payload: AppointmentViewType): CalendarViewState => {
    return {
        ...state,
        viewType: payload,
    }
}

export const handleViewMode = (state: CalendarViewState, payload: AppointmentViewMode): CalendarViewState => {
    return {
        ...state,
        viewMode: payload,
    }
}

export const handleFilterSelectedDate = (state: CalendarViewState, payload: Date): CalendarViewState => {
    return {
        ...state,
        filters: {
            ...state.filters,
            selectedDate: payload,
        }
    }
}

export const handleSetCalendarFilters = (state: CalendarViewState, payload:CalendarFilters):CalendarViewState => {
    return {
        ...state,
        filters: payload
    }
}
export const handleSetAppointment = (state: CalendarViewState, payload:Array<Appointment>): CalendarViewState => {
    return {
        ...state,
        appointments: payload
    }
}
export const CalendarReducer: Reducer<CalendarViewState, any> = (state: CalendarViewState = initialState, action: Actions) => {
    switch (action.type) {
        // Reset state on logout to prevent stale data across accounts
        case getType(logoutRequestAction.success):
            return { ...initialState };

        case getType(actions.toggleAddForm):
            return handleOpenAddForm(state, action.payload);
        case getType(actions.toggleEditFormAction):
            return handleToggleEditForm(state, action.payload);
        case getType(actions.setViewTypeAction):
            return handleSetViewType(state, action.payload);
        case getType(actions.setViewModeAction):
            return handleViewMode(state, action.payload);
        case getType(actions.setCalendarFilterAction.success):
            return handleSetCalendarFilters(state, action.payload);
        case getType(actions.fetchCalendarAppointments.success):
            return handleSetAppointment(state, action.payload);
        default:
            return state;
    }
}
