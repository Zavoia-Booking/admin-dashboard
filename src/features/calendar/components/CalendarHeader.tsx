import { type FC, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { getDisplayedMonthStart, getDisplayedWeekStart, getSelectedDate, getSidebarOpen, getViewModeSelector, getViewTypeSelector } from "../selectors.ts";
import { getCalendarLocale } from "../timezone.ts";
import { setDisplayedMonthAction, setDisplayedWeekAction, setSelectedDateAction, setViewModeAction, setViewTypeAction, setBlockFormEditingAction, toggleAddForm, toggleBlockFormAction, toggleCalendarSidebar, setScrollToNow, setSidebarMiniCalendarMonthAction } from "../actions.ts";
import { AppointmentViewMode, AppointmentViewType } from "../types.ts";
import { Button } from "../../../shared/components/ui/button.tsx";
import { ChevronLeft, ChevronRight, Plus, ShieldBan, PanelLeftClose, PanelLeftOpen, LayoutGrid, List, Settings, CalendarCheck2 } from "lucide-react";
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
  const { t } = useTranslation("calendar");
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
      // "Sat, 28 Mar 2026"
      const weekday = selectedDate.toLocaleDateString(getCalendarLocale(), { weekday: 'short' });
      const month = selectedDate.toLocaleDateString(getCalendarLocale(), { month: 'short' });
      return `${weekday}, ${selectedDate.getDate()} ${month} ${selectedDate.getFullYear()}`;
    }
    if (viewMode === AppointmentViewMode.WEEK) {
      const ws = displayedWeekStart ?? getWeekStart(selectedDate);
      const we = getWeekEnd(ws);
      const sameMonth = ws.getMonth() === we.getMonth();
      const monthStr = ws.toLocaleDateString(getCalendarLocale(), { month: 'short' });
      const endMonthStr = we.toLocaleDateString(getCalendarLocale(), { month: 'short' });
      // Same month: "23 – 29 Mar, 2026"
      // Cross-month: "28 Mar – 3 Apr, 2026"
      const result = sameMonth
        ? `${ws.getDate()} – ${we.getDate()} ${monthStr}, ${we.getFullYear()}`
        : `${ws.getDate()} ${monthStr} – ${we.getDate()} ${endMonthStr}, ${we.getFullYear()}`;
      return result;
    }
    // Month view: "March 2026"
    const monthDate = viewMode === AppointmentViewMode.MONTH && displayedMonthStart ? displayedMonthStart : selectedDate;
    return monthDate.toLocaleDateString(getCalendarLocale(), { month: 'long', year: 'numeric' });
  })();

  const handlePrev = useCallback(() => {
    if (viewMode === AppointmentViewMode.MONTH) {
      const base = displayedMonthStart ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
      dispatch(setDisplayedMonthAction(prev));
      dispatch(setSidebarMiniCalendarMonthAction(prev));
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
      dispatch(setSidebarMiniCalendarMonthAction(next));
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

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const currentPeriodLabel = (() => {
    return t("page.header.today");
  })();

  const isOnCurrentPeriod = (() => {
    const today = new Date();
    if (viewMode === AppointmentViewMode.DAY) {
      return isSameDay(selectedDate, today);
    }
    if (viewMode === AppointmentViewMode.WEEK) {
      const currentWeekStart = getWeekStart(today);
      const base = displayedWeekStart ?? getWeekStart(selectedDate);
      return isSameDay(base, currentWeekStart);
    }
    // MONTH
    const base = displayedMonthStart ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    return base.getFullYear() === today.getFullYear() && base.getMonth() === today.getMonth();
  })();

  const handleToday = useCallback(() => {
    if (isOnCurrentPeriod) return;
    dispatch(setScrollToNow(true));
    dispatch(setSelectedDateAction(new Date()));
  }, [dispatch, isOnCurrentPeriod]);

  const handleSetMode = useCallback((mode: AppointmentViewMode) => {
    dispatch(setViewModeAction(mode));
  }, [dispatch]);

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleCalendarSidebar(!sidebarOpen));
  }, [dispatch, sidebarOpen]);

  const handleToggleViewType = useCallback(() => {
    const next = viewType === AppointmentViewType.GRID ? AppointmentViewType.LIST : AppointmentViewType.GRID;
    dispatch(setViewTypeAction(next));
    if (next === AppointmentViewType.GRID) {
      dispatch(setScrollToNow(true));
    }
  }, [dispatch, viewType]);

  const handleOpenBlockForm = useCallback(() => {
    dispatch(setBlockFormEditingAction(null));
    dispatch(toggleBlockFormAction(true));
  }, [dispatch]);

  const handleOpenAddForm = useCallback(() => {
    dispatch(toggleAddForm({ open: true }));
  }, [dispatch]);

  return (
    <div
      className="flex flex-col px-4 pb-0.5 flex-shrink-0 gap-0.5 border-b border-border bg-white dark:bg-surface rounded-t-2xl"
    >
      {/* Row 1: date nav (left) · view tabs (center) · block + add event (right) */}
      <div className="flex items-center gap-2">
        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleToggleSidebar}
          title={sidebarOpen ? t("page.header.hideSidebar") : t("page.header.showSidebar")}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>

        {/* Date title with prev/next arrows */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-l font-semibold min-w-40 text-center cursor-default text-foreground tracking-tight whitespace-nowrap">{title}</h1>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: view mode tabs */}
        <div className="flex flex-1 justify-center">
          <div className="flex items-center bg-white dark:bg-surface rounded-full p-1 border shadow-sm">
            <div className="flex items-center gap-0.5">
              {([
                [AppointmentViewMode.MONTH, t("page.header.month")],
                [AppointmentViewMode.WEEK, t("page.header.week")],
                [AppointmentViewMode.DAY, t("page.header.day")],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => handleSetMode(mode)}
                  className={`!min-h-0 !h-6 px-4 py-0.5 text-sm rounded-full font-medium transition-all outline-none
                    focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0
                    ${viewMode === mode
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: unified pill — Block | Add Event | Filters | list | settings */}
        <div className="flex items-center rounded-full !h-8 border border-border bg-white dark:bg-surface shadow-sm flex-shrink-0">
          <button
            type="button"
            onClick={handleOpenBlockForm}
            className="group inline-flex items-center h-8 px-3 gap-1.5 text-xs font-medium text-foreground rounded-none transition-colors hover:bg-muted/50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0 focus-visible:ring-inset"
          >
            <ShieldBan className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary group-active:text-primary" />
            {t("page.header.block")}
          </button>
          <div className="w-px h-5 bg-border shrink-0" />
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="inline-flex items-center h-8 px-3 gap-1.5 text-xs font-medium text-foreground rounded-none transition-colors hover:bg-muted/50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0 focus-visible:ring-inset"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            {t("page.header.addEvent")}
          </button>
          <div className="w-px h-5 bg-border shrink-0" />
          <div className="flex-1 min-w-0"><CalendarHeaderFilters slim /></div>
          <div className="w-px h-5 bg-border shrink-0" />
          <button
            type="button"
            onClick={handleToday}
            disabled={isOnCurrentPeriod}
            className="group inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default hover:bg-muted/50 text-foreground whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0 focus-visible:ring-inset"
          >
            <CalendarCheck2 className="h-3.5 w-3.5 text-muted-foreground transition-colors group-enabled:group-hover:text-primary group-enabled:group-active:text-primary" />
            {currentPeriodLabel}
          </button>
          <div className="w-px h-5 bg-border shrink-0" />
          {(viewMode === AppointmentViewMode.DAY || viewMode === AppointmentViewMode.WEEK) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none group"
              onClick={handleToggleViewType}
              title={viewType === AppointmentViewType.GRID ? t("page.header.switchToList") : t("page.header.switchToGrid")}
            >
              {viewType === AppointmentViewType.GRID
                ? <List className="!h-4.5 !w-4.5 text-muted-foreground transition-colors group-hover:text-primary group-active:text-primary" />
                : <LayoutGrid className="!h-4.5 !w-4.5 text-muted-foreground transition-colors group-hover:text-primary group-active:text-primary" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none group"
            onClick={onOpenSettings}
            title={t("page.header.calendarSettings")}
          >
            <Settings className="!h-4.5 !w-4.5 text-muted-foreground transition-colors group-hover:text-primary group-active:text-primary" />
          </Button>
        </div>
      </div>

    </div>
  );
};
