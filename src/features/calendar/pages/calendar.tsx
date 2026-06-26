import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddAppointmentSlider from '../components/AddAppointmentSlider';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CalendarCheck2 } from "lucide-react";
import {
  toggleAddForm,
  toggleEditFormAction,
  hydrateCalendarDisplayPreferencesAction,
  setStaffFilter,
  setDayFiltersAction,
  setSelectedLocationAction,
  setSelectedDateAction,
  setScrollToNow,
  setDisplayedWeekAction,
  setDisplayedMonthAction,
} from "../actions";
import { getAppointmentDetailRequest } from "../api";
import {
  getAddFormSelector,
  getEditFormSelector,
  getViewModeSelector,
  getSelectedLocationId,
  getLocationContext,
  getLocationStaff,
  getStaffFilter,
  getDayFilters,
  getLocationTeamMembers,
  getSelectedDate,
  getDisplayedWeekStart,
  getMonthViewDisplayStart,
} from "../selectors.ts";
import { getWeekStart, getWeekEnd } from "../utils.ts";
import { getCalendarLocale } from "../timezone.ts";
import { NotificationBell } from "../../../shared/components/common/NotificationBell";
import { AppointmentViewMode } from "../types.ts";
import { calendarPreferences } from "../calendarPreferences.ts";
import { dispatchSelectDateAndDayView } from "../selectDateAndDayViewDispatch.ts";
import { store } from "../../../app/providers/store";
import EditAppointmentSlider from "../components/EditAppointmentSlider.tsx";
import { AppointmentGrid } from "../components/AppointmentGrid.tsx";
import { listLocationsAction } from "../../locations/actions.ts";
import { CreateBlockDrawer } from "../components/CreateBlockDrawer.tsx";
import { CalendarSidebar } from "../components/CalendarSidebar.tsx";
import { CalendarHeader } from "../components/CalendarHeader.tsx";
import { CalendarSettingsSheet } from "../components/CalendarSettingsSheet.tsx";
import { Card } from "../../../shared/components/ui/card.tsx";
import { useIsMobile } from "../../../shared/hooks/use-mobile.ts";
import { MobileCalendarLayout } from "../components/mobile/MobileCalendarLayout.tsx";

const Calendar = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const addFormOpen = useSelector(getAddFormSelector);
  const editForm = useSelector(getEditFormSelector);
  const viewMode: AppointmentViewMode = useSelector(getViewModeSelector);
  const selectedLocationId = useSelector(getSelectedLocationId);
  const locationContext = useSelector(getLocationContext);
  const locationTeamMembers = useSelector(getLocationTeamMembers);
  const locationStaff = useSelector(getLocationStaff);
  const staffFilter = useSelector(getStaffFilter);
  const dayFilters = useSelector(getDayFilters);
  const selectedDate = useSelector(getSelectedDate);
  const displayedWeekStart = useSelector(getDisplayedWeekStart);
  const displayedMonthStart = useSelector(getMonthViewDisplayStart);
  const hasRefetchedOnEnter = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation("calendar");

  /* ── "Today" chip for mobile breadcrumb header ──
   * True when tapping Today would be a no-op — i.e. selectedDate is already
   * today AND the displayed period is current. In Month mode both must hold,
   * so tapping Today from (current month, non-today selected) still selects
   * today instead of short-circuiting. */
  const isOnToday = useMemo(() => {
    const today = new Date();
    const selectedIsToday = selectedDate.toDateString() === today.toDateString();
    if (viewMode === AppointmentViewMode.DAY) {
      return selectedIsToday;
    }
    if (viewMode === AppointmentViewMode.WEEK) {
      const todayWeekStart = getWeekStart(today);
      const currentWeekStart = displayedWeekStart ?? getWeekStart(selectedDate);
      return (
        selectedIsToday &&
        todayWeekStart.getFullYear() === currentWeekStart.getFullYear() &&
        todayWeekStart.getMonth() === currentWeekStart.getMonth() &&
        todayWeekStart.getDate() === currentWeekStart.getDate()
      );
    }
    if (viewMode === AppointmentViewMode.MONTH) {
      const base = displayedMonthStart ?? selectedDate;
      return (
        selectedIsToday &&
        base.getFullYear() === today.getFullYear() &&
        base.getMonth() === today.getMonth()
      );
    }
    return true;
  }, [viewMode, selectedDate, displayedWeekStart, displayedMonthStart]);

  const handleToday = useCallback(() => {
    if (isOnToday) {
      // Already on today — give a confirmation pulse on the visible today pill
      // (week strip in Day mode, month grid cell in Month mode). Apple-style
      // feedback so the tap isn't silently ignored.
      window.dispatchEvent(new CustomEvent("calendar:today-pulse"));
      return;
    }
    const now = new Date();
    dispatch(setScrollToNow(true));
    dispatch(setSelectedDateAction(now));
    dispatch(setDisplayedWeekAction(getWeekStart(now)));
    dispatch(setDisplayedMonthAction(new Date(now.getFullYear(), now.getMonth(), 1)));
  }, [dispatch, isOnToday]);

  /* Mobile header prev/next — DAY → ±1 day, MONTH → ±1 month. Mobile
   * doesn't expose Week, so that branch is gone. */
  const handleMobilePrev = useCallback(() => {
    if (viewMode === AppointmentViewMode.MONTH) {
      const base = displayedMonthStart ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
      dispatch(setDisplayedMonthAction(prev));
      return;
    }
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    dispatch(setSelectedDateAction(prev));
  }, [dispatch, viewMode, displayedMonthStart, selectedDate]);

  const handleMobileNext = useCallback(() => {
    if (viewMode === AppointmentViewMode.MONTH) {
      const base = displayedMonthStart ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
      dispatch(setDisplayedMonthAction(next));
      return;
    }
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    dispatch(setSelectedDateAction(next));
  }, [dispatch, viewMode, displayedMonthStart, selectedDate]);

  // Always visible on mobile — `handleToday` is a no-op when already on today,
  // so the button is harmless and removes the "why does it come and go?" confusion.
  const showTodayChip = isMobile;

  /* On mobile, replace the breadcrumb "Calendar" title with a context-aware
   * title. Matches desktop `CalendarHeader` formatting for consistency:
   *  DAY   → "Sat, 28 Mar 2026"
   *  WEEK  → "23 – 29 Mar, 2026"  (or cross-month "28 Mar – 3 Apr, 2026")
   *  MONTH → "March 2026" */
  const mobileHeaderTitle = useMemo(() => {
    if (!isMobile) return undefined;
    const locale = getCalendarLocale();
    if (viewMode === AppointmentViewMode.DAY) {
      const weekday = selectedDate.toLocaleDateString(locale, { weekday: "short" });
      const month = selectedDate.toLocaleDateString(locale, { month: "short" });
      return `${weekday}, ${selectedDate.getDate()} ${month} ${selectedDate.getFullYear()}`;
    }
    if (viewMode === AppointmentViewMode.WEEK) {
      const ws = displayedWeekStart ?? getWeekStart(selectedDate);
      const we = getWeekEnd(ws);
      const sameMonth = ws.getMonth() === we.getMonth();
      const monthStr = ws.toLocaleDateString(locale, { month: "short" });
      const endMonthStr = we.toLocaleDateString(locale, { month: "short" });
      return sameMonth
        ? `${ws.getDate()} – ${we.getDate()} ${monthStr}, ${we.getFullYear()}`
        : `${ws.getDate()} ${monthStr} – ${we.getDate()} ${endMonthStr}, ${we.getFullYear()}`;
    }
    if (viewMode === AppointmentViewMode.MONTH) {
      const monthDate = displayedMonthStart ?? selectedDate;
      return monthDate.toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      });
    }
    return undefined;
  }, [isMobile, viewMode, displayedMonthStart, displayedWeekStart, selectedDate]);

  const mobileHeaderRight = isMobile ? (
    <div className="flex items-center gap-1">
      {showTodayChip && (
        <button
          type="button"
          onClick={handleToday}
          className="group inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium
            text-foreground cursor-pointer transition-colors hover:bg-muted/50
            outline-none focus-visible:ring-2 focus-visible:ring-ring/50
            animate-in fade-in slide-in-from-right-2 duration-200"
        >
          <CalendarCheck2 className="h-3.5 w-3.5 text-primary" />
          {t("page.header.today")}
        </button>
      )}
      <NotificationBell variant="header" />
    </div>
  ) : undefined;

  useEffect(() => {
    // Apply saved display preferences without triggering view-mode saga (avoids duplicate week/day/summary fetch when location selection runs next).
    // Mobile doesn't expose Week — if the stored preference is Week (e.g. set on
    // desktop), coerce to Day for rendering without mutating the stored value.
    const storedViewMode = calendarPreferences.getDefaultViewMode();
    const viewModeForHydration =
      isMobile && storedViewMode === AppointmentViewMode.WEEK
        ? AppointmentViewMode.DAY
        : storedViewMode;
    dispatch(
      hydrateCalendarDisplayPreferencesAction({
        viewMode: viewModeForHydration,
        viewType: calendarPreferences.getDefaultViewType(),
      }),
    );
  }, [dispatch, isMobile]);

  useEffect(() => {
    const appointmentIdParam = searchParams.get("appointmentId");
    if (!appointmentIdParam) return;

    const appointmentId = Number(appointmentIdParam);
    if (Number.isNaN(appointmentId)) return;

    setSearchParams({}, { replace: true });

    getAppointmentDetailRequest(appointmentId)
      .then((appointment) => {
        if (appointment) {
          dispatchSelectDateAndDayView(
            dispatch,
            new Date(appointment.scheduledAt),
            store.getState().calendarView.viewMode,
            store.getState().calendarView.selectedDate,
          );
          dispatch(toggleEditFormAction({ open: true, item: appointment }));
        }
      })
      .catch(() => {});
  }, [searchParams, setSearchParams, dispatch]);

  const pendingStaffEmail = useRef<string | null>(null);

  useEffect(() => {
    const staffEmailParam = searchParams.get("staffEmail");
    if (!staffEmailParam) return;

    setSearchParams({}, { replace: true });
    pendingStaffEmail.current = staffEmailParam;
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!pendingStaffEmail.current || locationTeamMembers.length === 0) return;

    const match = locationTeamMembers.find((m) => m.email === pendingStaffEmail.current);
    if (match) {
      dispatch(setStaffFilter([match.userId]));
      pendingStaffEmail.current = null;
    }
  }, [locationTeamMembers, dispatch]);

  useEffect(() => {
    // Locations needed for LocationSelector. Services and team are loaded per-location via assignments/full when a location is selected.
    dispatch(listLocationsAction.request());
  }, [dispatch]);


  /** Single-staff locations: preselect that member (no "all staff" UX); keep Redux/day filters aligned. */
  useEffect(() => {
    if (locationStaff.length !== 1) return;
    const loneId = locationStaff[0].id;
    if (dayFilters.unassignedOnly === true) return;
    if (
      dayFilters.staffUserIds != null &&
      dayFilters.staffUserIds.length > 0 &&
      (dayFilters.staffUserIds.length > 1 || dayFilters.staffUserIds[0] !== loneId)
    ) {
      return;
    }
    if (dayFilters.staffUserId != null && dayFilters.staffUserId !== loneId) return;

    const normalized = staffFilter.filter((id) => locationStaff.some((s) => s.id === id));
    const needsStaffFilter = normalized.length !== 1 || normalized[0] !== loneId;
    const needsDayStaffClear =
      dayFilters.staffUserIds != null || dayFilters.staffUserId != null;

    if (needsStaffFilter) {
      dispatch(setStaffFilter([loneId]));
    }
    if (needsDayStaffClear) {
      dispatch(
        setDayFiltersAction({
          ...dayFilters,
          staffUserIds: undefined,
          staffUserId: undefined,
        }),
      );
    }
  }, [dispatch, locationStaff, staffFilter, dayFilters]);

  // Refetch location context and current view when re-entering the calendar (already have a selected location and cached context)
  useEffect(() => {
    if (
      selectedLocationId != null &&
      locationContext != null &&
      !hasRefetchedOnEnter.current
    ) {
      hasRefetchedOnEnter.current = true;
      dispatch(setSelectedLocationAction(selectedLocationId));
    }
  }, [dispatch, selectedLocationId, locationContext]);

  const handleCloseAddForm = useCallback(() => {
    dispatch(toggleAddForm({ open: false }))
  },[dispatch])

  const handleCloseEditForm = useCallback(() => {
    dispatch(toggleEditFormAction({ item: null, open: false }))
  },[dispatch])

  return (
    <AppLayout
      contentClassName="max-w-[2000px]"
      noPadding={isMobile}
      headerRightContent={mobileHeaderRight}
      headerTitleOverride={mobileHeaderTitle}
      headerPrevAction={isMobile ? handleMobilePrev : undefined}
      headerNextAction={isMobile ? handleMobileNext : undefined}
    >
      <BusinessSetupGate>
        <>
          {isMobile ? (
            /* ─── Mobile Layout ─── */
            <MobileCalendarLayout onOpenSettings={() => setSettingsOpen(true)} />
          ) : (
            /* ─── Desktop Layout ─── */
            <div className="flex min-h-[calc(100vh-64px)] items-start">
              {/* ─── Left Sidebar ─── */}
              <CalendarSidebar />

              {/* ─── Main Content ─── */}
              <div className="flex-1 flex flex-col min-w-0 max-h-[calc(100dvh-34px)] bg-muted/10 dark:bg-transparent transition-[width,flex] duration-200 ease-linear">
                <div className="p-0 md:p-4 lg:p-6 !pl-4 !pt-0 !pb-0 flex flex-col flex-1 min-h-0">
                  <Card className="flex flex-col !gap-2 border-none pt-0.5 shadow-none md:border md:shadow-sm bg-white dark:bg-surface rounded-none md:rounded-xl flex-1 min-h-0">
                    {/* Top header bar */}
                    <CalendarHeader onOpenSettings={() => setSettingsOpen(true)} />

                    {/* Content area — single scroll container for all views */}
                    <div data-calendar-scroll className="relative flex-1 min-h-0 overflow-auto">
                      {/* Month view uses summary grid; Day & Week views use the time grid */}
                      <AppointmentGrid viewMode={viewMode} />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ─── Drawers / Sliders (portaled, shared between mobile & desktop) ─── */}
          <AddAppointmentSlider
            isOpen={addFormOpen}
            onClose={() => handleCloseAddForm()}
          />
          <EditAppointmentSlider
            isOpen={editForm.open}
            appointment={editForm.item}
            onClose={handleCloseEditForm}
          />
          <CreateBlockDrawer />
          <CalendarSettingsSheet
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        </>
      </BusinessSetupGate>
    </AppLayout>
  );
};

export default Calendar;
