import type { AppDispatch } from "../../app/providers/store.ts";
import { navigateToCalendarDateAction, setSelectedDateAction } from "./actions.ts";
import { AppointmentViewMode } from "./types.ts";

/**
 * Select a calendar day and ensure day view. When already in day view, only the date
 * action is dispatched so {@link handleSetSelectedDate} runs once (avoids double /calendar/day).
 * When switching from week/month, uses {@link navigateToCalendarDateAction} so only one fetch runs (not week then day).
 */
export function dispatchSelectDateAndDayView(
    dispatch: AppDispatch,
    day: Date,
    currentViewMode: AppointmentViewMode,
): void {
    if (currentViewMode === AppointmentViewMode.DAY) {
        dispatch(setSelectedDateAction(day));
    } else {
        dispatch(navigateToCalendarDateAction({ date: day, viewMode: AppointmentViewMode.DAY }));
    }
}
