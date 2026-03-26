import { type FC, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDisplayedMonthStart, getDisplayedWeekStart, getSelectedDate, getSidebarOpen, getViewModeSelector, getViewTypeSelector } from "../selectors.ts";
import { setDisplayedMonthAction, setDisplayedWeekAction, setSelectedDateAction, setViewModeAction, setViewTypeAction, toggleAddForm, toggleBlockFormAction, toggleCalendarSidebar } from "../actions.ts";
import { AppointmentViewMode, AppointmentViewType } from "../types.ts";
import { Button } from "../../../shared/components/ui/button.tsx";
import { ChevronLeft, ChevronRight, Plus, ShieldBan, PanelLeftClose, PanelLeftOpen, LayoutGrid, List, Settings } from "lucide-react";
import { getWeekStart, getWeekEnd } from "../utils.ts";
import { CalendarHeaderFilters } from "./CalendarHeaderFilters.tsx";

interface CalendarHeaderProps {
  onOpenSettings?: () => void;
}

/**
 * CalendarHeader — replaces the old DateTab + Filters top bar.
 * Contains month/year title, Day/Week/Month pill tabs, navigation arrows, action buttons.
 */
export const CalendarHeader: FC<CalendarHeaderProps> = ({ onOpenSettings }) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const displayedMonthStart = useSelector(getDisplayedMonthStart);
  const displayedWeekStart = useSelector(getDisplayedWeekStart);
  const viewMode = useSelector(getViewModeSelector);
  const viewType = useSelector(getViewTypeSelector);
  const sidebarOpen = useSelector(getSidebarOpen);

  // Context-aware title (month view uses displayed month, not selected date)
  const title = (() => {
    if (viewMode === AppointmentViewMode.DAY) {
      return selectedDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      });
    }
    if (viewMode === AppointmentViewMode.WEEK) {
      const ws = displayedWeekStart ?? getWeekStart(selectedDate);
      const we = getWeekEnd(ws);
      const startStr = ws.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      const endStr = we.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    const monthDate = viewMode === AppointmentViewMode.MONTH && displayedMonthStart ? displayedMonthStart : selectedDate;
    return monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();

  const handlePrev = useCallback(() => {
    if (viewMode === AppointmentViewMode.MONTH) {
      const base = displayedMonthStart ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
      dispatch(setDisplayedMonthAction(prev));
      return;
    }
    if (viewMode === AppointmentViewMode.WEEK) {
      const base = displayedWeekStart ?? getWeekStart(selectedDate);
      const prev = new Date(base);
      prev.setDate(base.getDate() - 7);
      dispatch(setDisplayedWeekAction(prev));
      return;
    }
    const next = new Date(selectedDate);
    next.setDate(next.getDate() - 1);
    dispatch(setSelectedDateAction(next));
  }, [dispatch, selectedDate, displayedMonthStart, displayedWeekStart, viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === AppointmentViewMode.MONTH) {
      const base = displayedMonthStart ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
      dispatch(setDisplayedMonthAction(next));
      return;
    }
    if (viewMode === AppointmentViewMode.WEEK) {
      const base = displayedWeekStart ?? getWeekStart(selectedDate);
      const next = new Date(base);
      next.setDate(base.getDate() + 7);
      dispatch(setDisplayedWeekAction(next));
      return;
    }
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    dispatch(setSelectedDateAction(next));
  }, [dispatch, selectedDate, displayedMonthStart, displayedWeekStart, viewMode]);

  const handleToday = useCallback(() => {
    dispatch(setSelectedDateAction(new Date()));
  }, [dispatch]);

  const handleSetMode = useCallback((mode: AppointmentViewMode) => {
    dispatch(setViewModeAction(mode));
  }, [dispatch]);

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleCalendarSidebar(!sidebarOpen));
  }, [dispatch, sidebarOpen]);

  const handleToggleViewType = useCallback(() => {
    dispatch(setViewTypeAction(viewType === AppointmentViewType.GRID ? AppointmentViewType.LIST : AppointmentViewType.GRID));
  }, [dispatch, viewType]);

  const handleOpenBlockForm = useCallback(() => {
    dispatch(toggleBlockFormAction(true));
  }, [dispatch]);

  const handleOpenAddForm = useCallback(() => {
    dispatch(toggleAddForm({ open: true }));
  }, [dispatch]);

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

      {/* Right: navigation + actions + filters (filters row below primary actions) */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
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

          {(viewMode === AppointmentViewMode.DAY || viewMode === AppointmentViewMode.WEEK) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handleToggleViewType}
              title={viewType === AppointmentViewType.GRID ? 'Switch to list view' : 'Switch to grid view'}
            >
              {viewType === AppointmentViewType.GRID ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onOpenSettings}
            title="Calendar Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <div className="w-2" />

          <Button variant="outline" size="sm" className="h-9 rounded-full px-4 text-xs font-medium border-dashed border-2" onClick={handleOpenBlockForm}>
            <ShieldBan className="h-3.5 w-3.5 mr-1.5" />
            Block
          </Button>
          <Button size="sm" className="h-9 rounded-full px-4 text-xs font-bold shadow-lg shadow-primary/20" onClick={handleOpenAddForm}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Event
          </Button>
        </div>
        <CalendarHeaderFilters />
      </div>
    </div>
  );
};
