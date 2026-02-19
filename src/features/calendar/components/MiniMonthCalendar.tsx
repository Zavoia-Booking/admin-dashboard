import { type FC, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedDate, getCalendarSummary } from "../selectors.ts";
import { setSelectedDateAction } from "../actions.ts";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/**
 * MiniMonthCalendar — compact calendar grid for the sidebar.
 * Shows the month around `displayMonth`, highlights today and selected date,
 * and shows dots for days with appointments.
 */
export const MiniMonthCalendar: FC = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector(getSelectedDate);
    const summary = useSelector(getCalendarSummary);

    // The mini calendar can navigate independently from the main calendar
    const [displayMonth, setDisplayMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const handlePrevMonth = useCallback(() => {
        setDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
        setDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const handleDayClick = useCallback((day: Date) => {
        dispatch(setSelectedDateAction(day));
    }, [dispatch]);

    // Build calendar cells
    const cells = useMemo(() => {
        const year = displayMonth.getFullYear();
        const month = displayMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Fill leading empty cells for days before the first of the month (Monday-first)
        const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
        const result: Array<{ date: Date; isCurrentMonth: boolean } | null> = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            const prevDate = new Date(year, month, 0 - (startDayOfWeek - 1 - i));
            result.push({ date: prevDate, isCurrentMonth: false });
        }

        // Current month days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            result.push({ date: new Date(year, month, d), isCurrentMonth: true });
        }

        // Fill trailing cells to complete the last row
        const remaining = 7 - (result.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                result.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
            }
        }

        return result;
    }, [displayMonth]);

    const todayStr = new Date().toDateString();
    const selectedStr = selectedDate.toDateString();

    const monthLabel = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div>
            {/* Month header with nav */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground-1">{monthLabel}</span>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={handlePrevMonth}
                        className="p-0.5 rounded hover:bg-muted transition-colors text-foreground-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-0.5 rounded hover:bg-muted transition-colors text-foreground-1"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-0">
                {DAY_LABELS.map(label => (
                    <div key={label} className="text-center text-xs font-medium text-muted-foreground py-1">
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0">
                {cells.map((cell, i) => {
                    if (!cell) return <div key={i} className="h-7" />;

                    const { date, isCurrentMonth } = cell;
                    const isToday = date.toDateString() === todayStr;
                    const isSelected = date.toDateString() === selectedStr;

                    // Check if day has appointments in summary data
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const hasDots = summary[dateKey]?.appointmentCount > 0;

                    return (
                        <button
                            key={i}
                            onClick={() => handleDayClick(date)}
                            className={`h-7 w-full flex flex-col items-center justify-center rounded-md text-xs font-medium transition-colors relative
                                ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                                ${isToday && !isSelected ? 'bg-primary/10 text-primary font-semibold' : ''}
                                ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                                ${!isToday && !isSelected && isCurrentMonth ? 'hover:bg-muted text-foreground-1' : ''}
                            `}
                        >
                            {date.getDate()}
                            {hasDots && !isToday && !isSelected && (
                                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
