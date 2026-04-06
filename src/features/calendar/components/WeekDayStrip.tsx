import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedDate, getWeekViewDisplayStart, getViewModeSelector } from "../selectors.ts";
import { getWeekStart } from "../utils.ts";
import { dispatchSelectDateAndDayView } from "../selectDateAndDayViewDispatch.ts";

const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface WeekDayStripProps {
  /** Width of the time gutter on the left (px) — must match the grid's gutter */
  gutterWidth: number;
}

export const WeekDayStrip: FC<WeekDayStripProps> = ({ gutterWidth }) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const weekDisplayStart = useSelector(getWeekViewDisplayStart);
  const viewMode = useSelector(getViewModeSelector);

  const days = useMemo(() => {
    const ws = weekDisplayStart ?? getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      return d;
    });
  }, [weekDisplayStart, selectedDate]);

  const handleDayClick = useCallback(
    (day: Date) => {
      dispatchSelectDateAndDayView(dispatch, day, viewMode);
    },
    [dispatch, viewMode],
  );

  const selectedStr = selectedDate.toDateString();
  const todayStr = new Date().toDateString();

  return (
    <div className="flex flex-shrink-0 pb-2 pt-0 sticky top-0 z-30 bg-white dark:bg-surface" style={{ minWidth: 7 * 100 + gutterWidth }}>
      <div style={{ width: gutterWidth }} className="flex-shrink-0" />

      {/* Day columns container — matches grid column layout exactly */}
      <div className="flex-1 flex">
        {days.map((day) => {
          const isSelected = day.toDateString() === selectedStr;
          const isToday = day.toDateString() === todayStr;

          return (
            <div key={day.toDateString()} className="flex-1 min-w-[100px] px-1">
              <button
                type="button"
                onClick={() => handleDayClick(day)}
                className={`w-full !min-h-0 !h-7 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border cursor-pointer outline-none
                  focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0
                  ${isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : isToday
                      ? 'bg-primary/15 border-primary/30 text-foreground hover:border-primary/50'
                      : 'bg-white dark:bg-surface border-border text-foreground hover:border-border-strong'
                  }
                `}
              >
                <span className={`text-xs ${isSelected || isToday ? 'font-semibold' : 'font-medium'}`}>
                  {FULL_DAY_NAMES[day.getDay()].slice(0, 3)}, {day.getDate()}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
