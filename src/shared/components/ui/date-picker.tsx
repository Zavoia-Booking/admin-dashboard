import React, { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../lib/utils';
import { getCalendarLocale } from '../../../features/calendar/timezone';

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date) => void;
  className?: string;
  placeholder?: string;
  viewMode?: 'day' | 'week' | 'month';
  minDate?: Date;
  maxDate?: Date;
  /** When true, trigger is rounded and connects to popover with open/close animation (e.g. add-appointment flow). */
  connectedPopover?: boolean;
  /** Optional class for popover content when connectedPopover (e.g. add-appointment-popover-expand). */
  contentClassName?: string;
  /**
   * Renders at the top of the calendar popover, above month navigation (e.g. “No end date” switch).
   * Full width; wrapper adds a bottom divider from the nav header.
   */
  popoverHeaderSlot?: ReactNode;
  /** When true, month navigation, Today, and date selection are non-interactive and visually muted (e.g. “No end date” on). */
  calendarDisabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value = null,
  onChange,
  className,
  placeholder = 'Select date',
  viewMode = 'day',
  minDate,
  maxDate,
  connectedPopover = false,
  contentClassName,
  popoverHeaderSlot,
  calendarDisabled = false,
}) => {
  const { t } = useTranslation("calendar");
  const locale = getCalendarLocale();
  const fallbackDate = value ?? new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [closingAnimation, setClosingAnimation] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!connectedPopover) return;
      if (open) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        setClosingAnimation(false);
      } else {
        setClosingAnimation(true);
        closeTimeoutRef.current = setTimeout(() => {
          setClosingAnimation(false);
          closeTimeoutRef.current = null;
        }, 250);
      }
    },
    [connectedPopover],
  );

  useEffect(() => {
    if (!connectedPopover) return;
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [connectedPopover]);

  const showOpenBorder = connectedPopover && (isOpen || closingAnimation);
  const [currentMonth, setCurrentMonth] = useState(fallbackDate);
  const [currentYear, setCurrentYear] = useState(fallbackDate.getFullYear());

  // Sync currentMonth with value when it changes
  useEffect(() => {
    const d = value ?? new Date();
    setCurrentMonth(d);
    setCurrentYear(d.getFullYear());
  }, [value]);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    return weekStart;
  };

  const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  const generateCalendarDays = (date: Date) => {
    const daysInCurrentMonth = daysInMonth(date);
    const firstDayOfMonth = getFirstDayOfMonth(date);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    return days;
  };

  const generateWeeks = (month: Date) => {
    const weeks = [];
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const currentWeekStart = getWeekStart(firstDay);
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = getWeekEnd(currentWeekStart);
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd)
      });
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const generateMonths = (year: number) => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(new Date(year, i, 1));
    }
    return months;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    if (value == null) return false;
    if (viewMode === 'day') {
      return date.toDateString() === value.toDateString();
    } else if (viewMode === 'week') {
      const selectedWeekStart = getWeekStart(value);
      const dateWeekStart = getWeekStart(date);
      return dateWeekStart.toDateString() === selectedWeekStart.toDateString();
    } else if (viewMode === 'month') {
      return date.getMonth() === value.getMonth() && date.getFullYear() === value.getFullYear();
    }
    return false;
  };

  const isSelectedWeek = (weekStart: Date) => {
    if (value == null) return false;
    const selectedWeekStart = getWeekStart(value);
    return weekStart.toDateString() === selectedWeekStart.toDateString();
  };

  const isSelectedMonth = (month: Date) => {
    if (value == null) return false;
    return month.getMonth() === value.getMonth() && month.getFullYear() === value.getFullYear();
  };

  const isSameMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear();
  };

  const isDateDisabled = (date: Date) => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (minDate != null) {
      const minDayStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (dayStart < minDayStart) return true;
    }
    if (maxDate != null) {
      const maxDayStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (dayStart > maxDayStart) return true;
    }
    return false;
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const handleWeekSelect = (weekStart: Date) => {
    // Set to the beginning of the selected week
    onChange(weekStart);
    setIsOpen(false);
  };

  const handleMonthSelect = (month: Date) => {
    // Set to the first day of the selected month
    onChange(month);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToPreviousYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const goToNextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setCurrentYear(today.getFullYear());
    // Today can sit outside the min/max window — navigate to it, but never select a disabled day.
    if (isDateDisabled(today)) return;
    onChange(today);
    setIsOpen(false);
  };

  const formatDisplayValue = () => {
    if (value == null) return placeholder;
    if (viewMode === 'day') {
      return value.toLocaleDateString(locale, { 
        month: 'short',
        day: 'numeric'
      });
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(value);
      const weekEnd = getWeekEnd(value);
      const startMonth = weekStart.toLocaleDateString(locale, { month: 'short' });
      const endMonth = weekEnd.toLocaleDateString(locale, { month: 'short' });
      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      } else {
        return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
      }
    } else if (viewMode === 'month') {
      return value.toLocaleDateString(locale, { 
        month: 'short',
        year: 'numeric'
      });
    }
    return placeholder;
  };

  const calendarDays = generateCalendarDays(currentMonth);
  const weeks = generateWeeks(currentMonth);
  const months = generateMonths(currentYear);
  const weekDays = useMemo(() => [
    t("page.common.dayNamesShort.sun"),
    t("page.common.dayNamesShort.mon"),
    t("page.common.dayNamesShort.tue"),
    t("page.common.dayNamesShort.wed"),
    t("page.common.dayNamesShort.thu"),
    t("page.common.dayNamesShort.fri"),
    t("page.common.dayNamesShort.sat"),
  ], [t]);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12 w-full bg-white border border-border text-sm font-medium text-foreground justify-start",
            connectedPopover
              ? "rounded-full px-4 hover:border-border-strong"
              : "rounded-lg",
            showOpenBorder &&
              "!rounded-b-none !rounded-t-[16px] border-x border-t border-b-0 border-border-strong dark:border-border-strong shadow-none",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatDisplayValue()}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 z-[90]",
          connectedPopover &&
            "!w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-trigger-width)] max-h-[calc(100vh-6rem)] box-border add-appointment-popover-expand -mt-px border border-t-0 rounded-t-none rounded-b-[16px] shadow-none overflow-hidden flex flex-col",
          connectedPopover &&
            (showOpenBorder ? "border-border-strong dark:border-border-strong" : "border-input dark:border-border"),
          !connectedPopover && "w-[320px]",
          contentClassName
        )}
        align="start"
        side="bottom"
        sideOffset={connectedPopover ? 0 : undefined}
        avoidCollisions={connectedPopover ? false : undefined}
      >
        <div className={cn("p-3 overflow-y-auto min-h-0", connectedPopover && "flex-1")}>
          {popoverHeaderSlot != null ? (
            <div className="-mx-3 -mt-1 border-b border-border px-3 pb-3 pt-1 mb-3">
              {popoverHeaderSlot}
            </div>
          ) : null}
          <div
            className={cn(
              calendarDisabled && "pointer-events-none select-none opacity-45 grayscale",
            )}
            aria-hidden={calendarDisabled ? true : undefined}
          >
            {/* Month / year navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={viewMode === 'month' ? goToPreviousYear : goToPreviousMonth}
                className="h-8 w-8 p-0 hover:bg-muted"
                disabled={calendarDisabled}
                tabIndex={calendarDisabled ? -1 : undefined}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-semibold">
                {viewMode === 'month'
                  ? currentYear.toString()
                  : currentMonth.toLocaleDateString(locale, {
                      month: 'long',
                      year: 'numeric',
                    })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={viewMode === 'month' ? goToNextYear : goToNextMonth}
                className="h-8 w-8 p-0 hover:bg-muted"
                disabled={calendarDisabled}
                tabIndex={calendarDisabled ? -1 : undefined}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Today Button */}
            <div className="mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="w-full text-xs"
                disabled={calendarDisabled}
                tabIndex={calendarDisabled ? -1 : undefined}
              >
                {t("page.common.today")}
              </Button>
            </div>

            {/* Day View - Calendar Grid */}
            {viewMode === 'day' && (
            <>
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const disabled = day != null && isDateDisabled(day);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "h-8 flex items-center justify-center text-sm rounded-md transition-colors",
                        !day && "invisible",
                        day && disabled && "cursor-not-allowed opacity-40 text-muted-foreground",
                        day && !disabled && "cursor-pointer",
                        day && !disabled && isToday(day) && "bg-primary/10 text-primary font-semibold",
                        day && !disabled && isSelected(day) && "bg-primary text-primary-foreground font-semibold",
                        day && !disabled && !isSelected(day) && !isToday(day) && isSameMonth(day) && "hover:bg-muted",
                        day && !disabled && !isSameMonth(day) && "text-muted-foreground/50"
                      )}
                      onClick={() => day && !disabled && handleDateSelect(day)}
                    >
                      {day?.getDate()}
                    </div>
                  );
                })}
              </div>
            </>
            )}

            {/* Week View - Week Selection */}
            {viewMode === 'week' && (
            <div className="space-y-1">
              {weeks.map((week, index) => {
                const isSelected = isSelectedWeek(week.start);
                const startMonth = week.start.toLocaleDateString(locale, { month: 'short' });
                const endMonth = week.end.toLocaleDateString(locale, { month: 'short' });
                const startDay = week.start.getDate();
                const endDay = week.end.getDate();
                
                let weekLabel;
                if (startMonth === endMonth) {
                  weekLabel = `${startMonth} ${startDay}-${endDay}`;
                } else {
                  weekLabel = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
                }
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                      isSelected && "bg-primary text-primary-foreground font-semibold",
                      !isSelected && "hover:bg-muted"
                    )}
                    onClick={() => handleWeekSelect(week.start)}
                  >
                    <span className="text-sm">{weekLabel}</span>
                    <span className="text-xs opacity-70">
                      Week {Math.ceil((week.start.getDate() + week.start.getDay()) / 7)}
                    </span>
                  </div>
                );
              })}
            </div>
            )}

            {/* Month View - Month Selection */}
            {viewMode === 'month' && (
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => {
                const isSelected = isSelectedMonth(month);
                const monthLabel = month.toLocaleDateString(locale, { month: 'short' });
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-center p-3 rounded-md cursor-pointer transition-colors text-sm",
                      isSelected && "bg-primary text-primary-foreground font-semibold",
                      !isSelected && "hover:bg-muted"
                    )}
                    onClick={() => handleMonthSelect(month)}
                  >
                    {monthLabel}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker; 