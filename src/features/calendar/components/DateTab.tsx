import { useCallback, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
import { useDispatch, useSelector } from "react-redux";
import { AppointmentViewMode, type CalendarFilters } from "../types.ts";
import { getFiltersSelector, getViewModeSelector } from "../selectors.ts";
import {
    geTabItemInfo,
    getMonthRange,
    getStartEndDate,
    getStartOfTheWeek,
    getViewItemList,
    getWeekRange
} from "../utils.ts";
import { setCalendarFilterAction, setViewModeAction } from "../actions.ts";

export const DateTabs = () => {
    const dispatch = useDispatch();
    const viewMode: AppointmentViewMode = useSelector(getViewModeSelector);
    const filters: CalendarFilters = useSelector(getFiltersSelector);
    const [currentWeekStart] =  useState(getStartOfTheWeek());

    const getViewItems = useCallback(() => {
        return getViewItemList(viewMode, currentWeekStart);
    }, [viewMode, currentWeekStart]);

    const handleClickTabs = useCallback((mode: AppointmentViewMode) => {
        let interval = getStartEndDate(filters.selectedDate);

        switch (mode) {
            case AppointmentViewMode.DAY:
                interval = getStartEndDate(filters.selectedDate)
                break
            case AppointmentViewMode.WEEK:
                interval = getWeekRange(filters.selectedDate)
                break
            case AppointmentViewMode.MONTH:
                interval = getMonthRange(filters.selectedDate)
                break
        }

        dispatch(setCalendarFilterAction.request({
            ...filters,
            startDate: interval.startDate,
            endDate: interval.endDate
        }))

        dispatch(setViewModeAction(mode))

    }, [dispatch, filters])

    const handleClickToday = useCallback(() => {
        const selectedDate = new Date();
        const { startDate, endDate } = getStartEndDate(selectedDate)
        const newFilters: CalendarFilters = {
            ...filters,
            selectedDate,
            endDate,
            startDate
        }

        dispatch(setCalendarFilterAction.request(newFilters))
    }, [dispatch, filters])

    const goToPreviousSection = useCallback(() => {
        console.log(viewMode)
        console.log('goToNextSection')
    },[viewMode]);

    const goToNextSection = useCallback(() => {
        console.log('goToNextSection')
    },[]);

    const handleClickCard = useCallback((item: Date) => {
        if (viewMode === AppointmentViewMode.DAY) {
            const interval = getStartEndDate(item)
            const newFilters = {
                ...filters,
                startDate: interval.startDate,
                endDate: interval.endDate,
                selectedDate: interval.startDate
            }
            dispatch(setCalendarFilterAction.request(newFilters))
        }
    }, [dispatch, viewMode, filters])

    return (<div>
        {/* View Mode Filter */}
        <div className="mb-4">
            <div className="flex items-center justify-between">
                <div className="inline-flex bg-muted/50 rounded-lg p-1 border border-border">
                    {([AppointmentViewMode.DAY, AppointmentViewMode.WEEK, AppointmentViewMode.MONTH]).map((mode) => (
                        <button
                            key={mode}
                            onClick={()=> {
                                handleClickTabs(mode)
                            }}
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
                    onClick={() => {
                        handleClickToday()
                    }}
                    className="flex items-center gap-2 text-xs"
                >
                    <CalendarDays className="h-4 w-4"/>
                    Today
                </Button>
            </div>
        </div>

        {/*Date Navigation - visible for both list and grid views*/}
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
                {getViewItems().map((item, index) => {
                    const { isSelected, displayText, subText } = geTabItemInfo(viewMode, filters.selectedDate, item);

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