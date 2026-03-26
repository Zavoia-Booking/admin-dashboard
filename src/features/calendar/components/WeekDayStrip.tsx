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

  return (
    <div className="flex bg-transparent flex-shrink-0 pb-4 px-4 pt-2 gap-2">
      <div style={{ width: gutterWidth }} className="flex-shrink-0" />

      {/* Day columns container — each card is clickable to switch to Day view */}
      <div className="flex-1 flex gap-2">
        {days.map((day) => {
          const isSelected = day.toDateString() === selectedStr;

          return (
            <button
              type="button"
              key={day.toDateString()}
              onClick={() => handleDayClick(day)}
              className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl border transition-all cursor-pointer
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
            </button>
          );
        })}
      </div>
    </div>
  );
};
