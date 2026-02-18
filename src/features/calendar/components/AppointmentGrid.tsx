import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { dayNames } from "../utils.ts";
import { AppointmentViewMode, AppointmentViewType } from "../types.ts";
import { CalendarTimeGrid } from "./CalendarTimeGrid.tsx";
import { AppointmentList } from "./AppointmentList.tsx";
import type {
    DaySummary,
    AppointmentPreview,
} from "../../../shared/types/calendar.ts";
import {
    getCalendarSummary,
    getSummaryLoading,
    getSelectedDate,
    getSelectedLocationId,
    getViewTypeSelector,
    getMonthViewDisplayStart,
} from "../selectors.ts";
import { setSelectedDateAction, setViewModeAction } from "../actions.ts";
import { Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface IProps {
    viewMode: AppointmentViewMode;
}

export const AppointmentGrid: FC<IProps> = ({ viewMode }) => {
    const selectedLocationId = useSelector(getSelectedLocationId);
    const viewType = useSelector(getViewTypeSelector);

    if (!selectedLocationId) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Select a location to view the calendar.</p>
                </CardContent>
            </Card>
        );
    }

    // Day & Week views: list view or time grid
    if (viewMode === AppointmentViewMode.DAY || viewMode === AppointmentViewMode.WEEK) {
        if (viewType === AppointmentViewType.LIST) {
            return (
                <div className="p-4">
                    <AppointmentList />
                </div>
            );
        }
        return <CalendarTimeGrid viewMode={viewMode} />;
    }

    // Month view always uses summary grid
    return <SummaryGrid />;
};

// ─────────────────────────────────────────────────────────────
// Summary Grid (Month view)
// ─────────────────────────────────────────────────────────────

/** Pastel preview colors (matching AppointmentBlock status palette) */
const getPreviewStatusColor = (status: string): string => {
    switch (status) {
        case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'no_show': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
        case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        case 'cancelled': return 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400';
        default: return 'bg-primary/10 text-primary';
    }
};

const SummaryGrid: FC = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector(getSelectedDate);
    const monthViewDisplayStart = useSelector(getMonthViewDisplayStart);
    const summary = useSelector(getCalendarSummary);
    const isLoading = useSelector(getSummaryLoading);

    const handleDayClick = useCallback((day: Date) => {
        dispatch(setSelectedDateAction(day));
        dispatch(setViewModeAction(AppointmentViewMode.DAY));
    }, [dispatch]);

    // Build month calendar cells from displayed month (not selected date, so prev/next don't move selection)
    const dayCells = useMemo(() => {
        const base = monthViewDisplayStart ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const year = base.getFullYear();
        const month = base.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        // Monday-first week: Mon=0, Sun=6
        const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
        const lastDayOfWeek = (lastDay.getDay() + 6) % 7;
        const start = new Date(firstDay);
        start.setDate(firstDay.getDate() - firstDayOfWeek);
        const end = new Date(lastDay);
        end.setDate(lastDay.getDate() + (6 - lastDayOfWeek));

        const cells = [];
        const current = new Date(start);
        while (current <= end) {
            cells.push({
                date: new Date(current),
                isCurrentMonth: current.getMonth() === month,
            });
            current.setDate(current.getDate() + 1);
        }
        return cells;
    }, [monthViewDisplayStart, selectedDate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading calendar...</span>
            </div>
        );
    }

    const todayStr = new Date().toDateString();

    return (
        <div className="p-4">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-px mb-1">
                {dayNames.map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {dayCells.map(({ date, isCurrentMonth }) => {
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const daySummary: DaySummary | undefined = summary[dateKey];
                    const isToday = date.toDateString() === todayStr;
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isClosed = daySummary && !daySummary.isOpen;

                    return (
                        <div
                            key={dateKey}
                            className={`relative isolate min-h-[100px] min-w-0 bg-background transition-colors cursor-pointer p-1.5 overflow-hidden
                                ${!isCurrentMonth ? 'bg-muted/30 dark:bg-muted/10' : 'hover:bg-muted/20 dark:hover:bg-muted/10'}
                                ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}
                                ${isClosed ? 'bg-muted/20 dark:bg-muted/10' : ''}
                            `}
                            onClick={() => handleDayClick(date)}
                        >
                            {/* Day number */}
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                                        ${isToday
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : isCurrentMonth
                                                ? 'text-foreground'
                                                : 'text-muted-foreground/50'
                                        }
                                        ${isSelected && !isToday ? 'ring-2 ring-primary' : ''}
                                    `}
                                >
                                    {date.getDate()}
                                </span>

                                {/* Dot indicators */}
                                {daySummary && (
                                    <div className="flex items-center gap-0.5">
                                        {daySummary.appointmentCount > 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${daySummary.appointmentCount} appointment(s)`} />
                                        )}
                                        {daySummary.blockedSlots > 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`${daySummary.blockedSlots} block(s)`} />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Summary content */}
                            <div className="space-y-0.5">
                                {daySummary && (
                                    <>
                                        {isClosed && (
                                            <div className="text-[10px] text-muted-foreground italic">Closed</div>
                                        )}
                                        {daySummary.appointmentCount > 0 && !isClosed && (
                                            <div className="text-[10px] font-medium text-muted-foreground">
                                                {daySummary.appointmentCount} appt{daySummary.appointmentCount !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                        {/* Preview appointments */}
                                        {daySummary.firstAppointments?.slice(0, 3).map((preview: AppointmentPreview) => (
                                            <div
                                                key={preview.id}
                                                className={`text-[10px] truncate rounded px-1 py-px font-medium ${getPreviewStatusColor(preview.status)}`}
                                            >
                                                {preview.bookedItemName || preview.customerName}
                                            </div>
                                        ))}
                                        {(daySummary.firstAppointments?.length ?? 0) > 3 && (
                                            <div className="text-[10px] text-muted-foreground pl-1">
                                                +{(daySummary.firstAppointments?.length ?? 0) - 3} more
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
