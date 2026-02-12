import { type FC, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedDate, getSidebarOpen, getViewModeSelector } from "../selectors.ts";
import { setSelectedDateAction, setViewModeAction, toggleAddForm, toggleBlockFormAction, toggleCalendarSidebar } from "../actions.ts";
import { AppointmentViewMode } from "../types.ts";
import { Button } from "../../../shared/components/ui/button.tsx";
import { ChevronLeft, ChevronRight, Plus, ShieldBan, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getWeekStart, getWeekEnd } from "../utils.ts";

/**
 * CalendarHeader — replaces the old DateTab + Filters top bar.
 * Contains month/year title, Day/Week/Month pill tabs, navigation arrows, action buttons.
 */
export const CalendarHeader: FC = () => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const viewMode = useSelector(getViewModeSelector);
  const sidebarOpen = useSelector(getSidebarOpen);

  // Context-aware title
  const title = (() => {
    if (viewMode === AppointmentViewMode.DAY) {
      return selectedDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      });
    }
    if (viewMode === AppointmentViewMode.WEEK) {
      const ws = getWeekStart(selectedDate);
      const we = getWeekEnd(selectedDate);
      const startStr = ws.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      const endStr = we.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();

  const handlePrev = useCallback(() => {
    const next = new Date(selectedDate);
    if (viewMode === AppointmentViewMode.DAY) {
      next.setDate(next.getDate() - 1);
    } else if (viewMode === AppointmentViewMode.WEEK) {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    dispatch(setSelectedDateAction(next));
  }, [dispatch, selectedDate, viewMode]);

  const handleNext = useCallback(() => {
    const next = new Date(selectedDate);
    if (viewMode === AppointmentViewMode.DAY) {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === AppointmentViewMode.WEEK) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    dispatch(setSelectedDateAction(next));
  }, [dispatch, selectedDate, viewMode]);

  const handleToday = useCallback(() => {
    dispatch(setSelectedDateAction(new Date()));
  }, [dispatch]);

  const handleSetMode = useCallback((mode: AppointmentViewMode) => {
    dispatch(setViewModeAction(mode));
  }, [dispatch]);

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleCalendarSidebar(!sidebarOpen));
  }, [dispatch, sidebarOpen]);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-transparent flex-shrink-0 gap-4">
      {/* Left: sidebar toggle + title */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleToggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>
        <h1 className="text-3xl font-bold text-foreground truncate tracking-tight">{title}</h1>
      </div>

      {/* Center: view mode tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-surface rounded-full p-1 border shadow-sm flex-shrink-0">
        {([
          [AppointmentViewMode.MONTH, 'Month'],
          [AppointmentViewMode.WEEK, 'Week'],
          [AppointmentViewMode.DAY, 'Day'],
        ] as const).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => handleSetMode(mode)}
            className={`px-4 py-1.5 text-sm rounded-full font-medium transition-all
                            ${viewMode === mode
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right: navigation + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center bg-white dark:bg-surface rounded-full border shadow-sm p-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-medium px-3" onClick={handleToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-4" /> {/* Spacer */}

        <Button variant="outline" size="sm" className="h-9 rounded-full px-4 text-xs font-medium border-dashed border-2" onClick={() => dispatch(toggleBlockFormAction(true))}>
          <ShieldBan className="h-3.5 w-3.5 mr-1.5" />
          Block
        </Button>
        <Button size="sm" className="h-9 rounded-full px-4 text-xs font-bold shadow-lg shadow-primary/20" onClick={() => dispatch(toggleAddForm(true))}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Event
        </Button>
      </div>
    </div>
  );
};
