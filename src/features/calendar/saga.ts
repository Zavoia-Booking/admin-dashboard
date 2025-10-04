import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type { ActionType } from "typesafe-actions";
import { createCalendarAppointmentAction, fetchCalendarAppointments, setCalendarFilterAction } from "./actions.ts";
import { createAppointmentsRequest, getAppointmentsRequest } from "./api.ts";
import type { CalendarFilters } from "./types.ts";
import { getFiltersSelector } from "./selectors.ts";
import { getFilterPayload, mapToAppointmentList } from "./utils.ts";

function* handleGetAppointments() {

    const filters: CalendarFilters = yield select(getFiltersSelector);

    try {
        const getResponse: unknown = yield call(getAppointmentsRequest, getFilterPayload(filters));

        yield put(fetchCalendarAppointments.success(mapToAppointmentList(getResponse as any)));

    } catch (error: any) {
        console.log(error);
    }
}

function* handleCreateAppointments(action: ActionType<typeof createCalendarAppointmentAction.request>) {

    console.log('handleCreateAppointments')

    try {
        const appointments: unknown = yield call(createAppointmentsRequest, action.payload);
        console.log(appointments);

    } catch (error: any) {
        console.log(error);
    }
}

function* handleSetCalendarFilters(action: ActionType<typeof setCalendarFilterAction.request>) {
    yield put(setCalendarFilterAction.success(action.payload))
    yield put(fetchCalendarAppointments.request())
}

export function* calendarSaga(): Generator<any, void, any> {
    yield all([
        takeLatest(fetchCalendarAppointments.request, handleGetAppointments),
        takeLatest(createCalendarAppointmentAction.request, handleCreateAppointments),
        takeLatest(setCalendarFilterAction.request, handleSetCalendarFilters)
    ]);
}

