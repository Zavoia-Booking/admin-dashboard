import type { AppDispatch } from "../../app/providers/store.ts";
import { setSelectedDateAction, setViewModeAction } from "./actions.ts";
import { AppointmentViewMode } from "./types.ts";

/**
 * Select a calendar day and ensure day view. When already in day view, only the date
 * action is dispatched so {@link handleSetSelectedDate} runs once (avoids double /calendar/day).
 */
export function dispatchSelectDateAndDayView(
    dispatch: AppDispatch,
    day: Date,
    currentViewMode: AppointmentViewMode,
): void {
    dispatch(setSelectedDateAction(day));
    if (currentViewMode !== AppointmentViewMode.DAY) {
        dispatch(setViewModeAction(AppointmentViewMode.DAY));
    }
}
