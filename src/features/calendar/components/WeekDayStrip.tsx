import { type FC, useMemo } from "react";
import { useSelector } from "react-redux";
import { getSelectedDate } from "../selectors.ts";
import { getWeekStart } from "../utils.ts";

const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface WeekDayStripProps {
  /** Width of the time gutter on the left (px) — must match the grid's gutter */
  gutterWidth: number;
}

export const WeekDayStrip: FC<WeekDayStripProps> = ({ gutterWidth }) => {
  const selectedDate = useSelector(getSelectedDate);

  const days = useMemo(() => {
    const ws = getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const todayStr = new Date().toDateString();
  const selectedStr = selectedDate.toDateString();

  return (
    <div className="flex bg-transparent flex-shrink-0 pb-4 px-4 pt-2 gap-2">
      <div style={{ width: gutterWidth }} className="flex-shrink-0" />

      {/* Day columns container */}
      <div className="flex-1 flex gap-2">
        {days.map((day) => {
          const isToday = day.toDateString() === todayStr;
          const isSelected = day.toDateString() === selectedStr;

          return (
            <div
              key={day.toDateString()}
              className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl border transition-all
                                ${isSelected
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                  : 'bg-white dark:bg-surface border-border text-foreground hover:border-border-strong'
                }
                            `}
            >
              <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-neutral-400' : 'text-muted-foreground'}`}>
                {FULL_DAY_NAMES[day.getDay()]}
              </span>
              <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
