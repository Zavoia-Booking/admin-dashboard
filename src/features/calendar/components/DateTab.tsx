import { useCallback, useMemo } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
import { useDispatch, useSelector } from "react-redux";
import { AppointmentViewMode, type CalendarFilters } from "../types.ts";
import { getFiltersSelector, getSelectedDate, getViewModeSelector } from "../selectors.ts";
import {
    getTabItemInfo,
    getMonthRange,
    getStartEndDate,
    getViewItemList,
    getWeekRange,
    getWeekStart,
} from "../utils.ts";
import { setCalendarFilterAction, setSelectedDateAction, setViewModeAction } from "../actions.ts";

/**
 * Dispatches both the new setSelectedDateAction (triggers new saga cascade)
 * and the legacy setCalendarFilterAction (keeps legacy views working during migration).
 */
const useDateNavigation = () => {
    const dispatch = useDispatch();
    const filters: CalendarFilters = useSelector(getFiltersSelector);

    const navigateToDate = useCallback((date: Date, mode: AppointmentViewMode) => {
        // 1. Dispatch new action (triggers saga: summary + day data refetch)
        dispatch(setSelectedDateAction(date));

        // 2. Legacy compat: update old filters so existing list/grid views still work
        let interval: { startDate: Date; endDate: Date };
        switch (mode) {
            case AppointmentViewMode.WEEK:
                interval = getWeekRange(date);
                break;
            case AppointmentViewMode.MONTH:
                interval = getMonthRange(date);
                break;
            case AppointmentViewMode.DAY:
            default:
                interval = getStartEndDate(date);
                break;
        }

        dispatch(setCalendarFilterAction.request({
            ...filters,
            selectedDate: date,
            startDate: interval.startDate,
            endDate: interval.endDate,
        }));
    }, [dispatch, filters]);

    return navigateToDate;
};

export const DateTabs = () => {
    const dispatch = useDispatch();
    const viewMode: AppointmentViewMode = useSelector(getViewModeSelector);
    const selectedDate: Date = useSelector(getSelectedDate);
    const navigateToDate = useDateNavigation();

    // Derive the week start from the selected date (not stuck at initial value)
    const currentWeekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);

    const viewItems = useMemo(() => {
        return getViewItemList(viewMode, currentWeekStart);
    }, [viewMode, currentWeekStart]);

    // --- View mode tabs (Day / Week / Month) ---
    const handleClickTabs = useCallback((mode: AppointmentViewMode) => {
        dispatch(setViewModeAction(mode));
        navigateToDate(selectedDate, mode);
    }, [dispatch, selectedDate, navigateToDate]);

    // --- Today button ---
    const handleClickToday = useCallback(() => {
        navigateToDate(new Date(), viewMode);
    }, [viewMode, navigateToDate]);

    // --- Prev / Next navigation ---
    const goToPreviousSection = useCallback(() => {
        const prev = new Date(selectedDate);

        switch (viewMode) {
            case AppointmentViewMode.DAY:
                prev.setDate(prev.getDate() - 1);
                break;
            case AppointmentViewMode.WEEK:
                prev.setDate(prev.getDate() - 7);
                break;
            case AppointmentViewMode.MONTH:
                prev.setMonth(prev.getMonth() - 1);
                break;
        }

        navigateToDate(prev, viewMode);
    }, [selectedDate, viewMode, navigateToDate]);

    const goToNextSection = useCallback(() => {
        const next = new Date(selectedDate);

        switch (viewMode) {
            case AppointmentViewMode.DAY:
                next.setDate(next.getDate() + 1);
                break;
            case AppointmentViewMode.WEEK:
                next.setDate(next.getDate() + 7);
                break;
            case AppointmentViewMode.MONTH:
                next.setMonth(next.getMonth() + 1);
                break;
        }

        navigateToDate(next, viewMode);
    }, [selectedDate, viewMode, navigateToDate]);

    // --- Click on a date card ---
    const handleClickCard = useCallback((item: Date) => {
        if (viewMode === AppointmentViewMode.DAY) {
            navigateToDate(item, viewMode);
        } else if (viewMode === AppointmentViewMode.WEEK) {
            // Clicking a week card selects the start of that week and switches to day view
            dispatch(setViewModeAction(AppointmentViewMode.WEEK));
            navigateToDate(item, AppointmentViewMode.WEEK);
        } else if (viewMode === AppointmentViewMode.MONTH) {
            // Clicking a month card selects the first of that month
            dispatch(setViewModeAction(AppointmentViewMode.MONTH));
            navigateToDate(item, AppointmentViewMode.MONTH);
        }
    }, [dispatch, viewMode, navigateToDate]);

    return (<div>
        {/* View Mode Filter */}
        <div className="mb-4">
            <div className="flex items-center justify-between">
                <div className="inline-flex bg-muted/50 rounded-lg p-1 border border-border">
                    {([AppointmentViewMode.DAY, AppointmentViewMode.WEEK, AppointmentViewMode.MONTH]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => handleClickTabs(mode)}
                            className={`
                    px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out
                    ${(viewMode === mode)
                                ? 'bg-background text-foreground shadow-sm border border-border'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }
                  `}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClickToday}
                    className="flex items-center gap-2 text-xs"
                >
                    <CalendarDays className="h-4 w-4"/>
                    Today
                </Button>
            </div>
        </div>

        {/* Date Navigation - visible for both list and grid views */}
        <div className="mb-4 flex items-start">
            <button
                onClick={goToPreviousSection}
                className="flex items-center justify-center px-3 py-4 rounded-lg min-w-[50px]
                 h-16 bg-white border border-border hover:bg-muted/50 transition-colors flex-shrink-0"
            >
                <ChevronLeft className="h-5 w-5"/>
            </button>
            <div
                className="flex items-center gap-2 flex-1 overflow-x-auto px-2 mx-2
                 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {viewItems.map((item, index) => {
                    const { isSelected, displayText, subText } = getTabItemInfo(viewMode, selectedDate, item);

                    return (
                        <button
                            key={index}
                            onClick={() => handleClickCard(item)}
                            data-selected={isSelected}
                            className={`flex-shrink-0 flex flex-col items-center 
                                ${viewMode === AppointmentViewMode.DAY ? 'px-2' : 'px-1'} py-3 rounded-lg
                                ${viewMode === AppointmentViewMode.DAY ? 'w-[50px]' : 'w-[70px]'} h-16 transition-colors
                                ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-white border border-border hover:bg-muted/50'
                                }`
                            }
                        >
                            <span className="text-xs font-medium leading-tight text-center">
                              {displayText}
                            </span>
                            <span className="text-sm font-semibold leading-tight text-center">
                              {subText}
                            </span>
                        </button>
                    );
                })}
            </div>
            <button
                onClick={goToNextSection}
                className="flex items-center justify-center px-3 py-4 rounded-lg min-w-[50px]
                h-16 bg-white border border-border hover:bg-muted/50 transition-colors flex-shrink-0"
            >
                <ChevronRight className="h-5 w-5"/>
            </button>
        </div>
    </div>)
}