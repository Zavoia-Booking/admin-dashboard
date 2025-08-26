import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  placeholder?: string;
  viewMode?: 'day' | 'week' | 'month';
}

const DatePicker: React.FC<DatePickerProps> = ({ 
  value, 
  onChange, 
  className,
  placeholder = "Select date",
  viewMode = 'day'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value);
  const [currentYear, setCurrentYear] = useState(value.getFullYear());

  // Sync currentMonth with value when it changes
  useEffect(() => {
    setCurrentMonth(value);
    setCurrentYear(value.getFullYear());
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
    if (viewMode === 'day') {
      return date.toDateString() === value.toDateString();
    } else if (viewMode === 'week') {
      const selectedWeekStart = getWeekStart(value);
      const selectedWeekEnd = getWeekEnd(value);
      const dateWeekStart = getWeekStart(date);
      return dateWeekStart.toDateString() === selectedWeekStart.toDateString();
    } else if (viewMode === 'month') {
      return date.getMonth() === value.getMonth() && date.getFullYear() === value.getFullYear();
    }
    return false;
  };

  const isSelectedWeek = (weekStart: Date) => {
    const selectedWeekStart = getWeekStart(value);
    return weekStart.toDateString() === selectedWeekStart.toDateString();
  };

  const isSelectedMonth = (month: Date) => {
    return month.getMonth() === value.getMonth() && month.getFullYear() === value.getFullYear();
  };

  const isSameMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear();
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
    onChange(today);
    setIsOpen(false);
  };

  const formatDisplayValue = () => {
    if (viewMode === 'day') {
      return value.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(value);
      const weekEnd = getWeekEnd(value);
      const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      } else {
        return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
      }
    } else if (viewMode === 'month') {
      return value.toLocaleDateString('en-US', { 
        month: 'short',
        year: 'numeric'
      });
    }
    return '';
  };

  const calendarDays = generateCalendarDays(currentMonth);
  const weeks = generateWeeks(currentMonth);
  const months = generateMonths(currentYear);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-11 w-full bg-white border border-border rounded-lg text-sm font-medium text-foreground justify-start",
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
      <PopoverContent className="w-[320px] p-0 z-[90]" align="start">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={viewMode === 'month' ? goToPreviousYear : goToPreviousMonth}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold">
              {viewMode === 'month' 
                ? currentYear.toString()
                : currentMonth.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={viewMode === 'month' ? goToNextYear : goToNextMonth}
              className="h-8 w-8 p-0 hover:bg-muted"
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
            >
              Today
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
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-8 flex items-center justify-center text-sm rounded-md cursor-pointer transition-colors",
                      !day && "invisible",
                      day && isToday(day) && "bg-primary/10 text-primary font-semibold",
                      day && isSelected(day) && "bg-primary text-primary-foreground font-semibold",
                      day && !isSelected(day) && !isToday(day) && isSameMonth(day) && "hover:bg-muted",
                      day && !isSameMonth(day) && "text-muted-foreground/50"
                    )}
                    onClick={() => day && handleDateSelect(day)}
                  >
                    {day?.getDate()}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Week View - Week Selection */}
          {viewMode === 'week' && (
            <div className="space-y-1">
              {weeks.map((week, index) => {
                const isSelected = isSelectedWeek(week.start);
                const startMonth = week.start.toLocaleDateString('en-US', { month: 'short' });
                const endMonth = week.end.toLocaleDateString('en-US', { month: 'short' });
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
                const monthLabel = month.toLocaleDateString('en-US', { month: 'short' });
                
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
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker; 