import type { AppDispatch } from "../../app/providers/store.ts";
import { navigateToCalendarDateAction, setSelectedDateAction } from "./actions.ts";
import { AppointmentViewMode } from "./types.ts";
import { isSameDay } from "./utils.ts";

/**
 * Select a calendar day and ensure day view. When already in day view, only the date
 * action is dispatched so {@link handleSetSelectedDate} runs once (avoids double /calendar/day).
 * When switching from week/month, uses {@link navigateToCalendarDateAction} so only one fetch runs (not week then day).
 *
 * If the user taps the day they're already on in DAY view, nothing is dispatched —
 * the saga would otherwise refetch the same /calendar/day we already have.
 */
export function dispatchSelectDateAndDayView(
    dispatch: AppDispatch,
    day: Date,
    currentViewMode: AppointmentViewMode,
    currentSelectedDate: Date | null | undefined,
): void {
    if (currentViewMode === AppointmentViewMode.DAY) {
        if (isSameDay(day, currentSelectedDate)) return;
        dispatch(setSelectedDateAction(day));
    } else {
        dispatch(navigateToCalendarDateAction({ date: day, viewMode: AppointmentViewMode.DAY }));
    }
}
