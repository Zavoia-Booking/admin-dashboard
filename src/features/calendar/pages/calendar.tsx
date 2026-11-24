import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddAppointmentSlider from '../components/AddAppointmentSlider';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Button } from '../../../shared/components/ui/button';
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
  setSelectedDateAction,
  setSelectedLocationAction,
  setDisplayedWeekAction,
  setDisplayedMonthAction,
  fetchLocationContext,
  refreshVisibleDay,
} from "../actions";
import { getAppointmentDetailRequest } from "../api";
import {
  getAddFormSelector,
  getEditFormSelector,
  getViewModeSelector,
  getViewTypeSelector,
  getCalendarTimezone,
  getSelectedLocationId,
  getLocationContext,
  getLocationStaff,
  getStaffFilter,
  getDayFilters,
  getLocationTeamMembers,
  getSelectedDate,
  getDisplayedWeekStart,
  getMonthViewDisplayStart,
  getLocationContextError,
  getSummaryError,
  getDayDataError,
  getWeekDataError,
  getCalendarSummary,
  getDayData,
  getWeekData,
} from "../selectors.ts";
import { getWeekStart, getWeekEnd } from "../utils.ts";
import { formatDateInTimezone, getCalendarLocale, localCalendarDateFromDateKey, minSelectableCalendarDateForTimezone, wallDateKey } from "../timezone.ts";
import { NotificationBell } from "../../../shared/components/common/NotificationBell";
import { AppointmentViewMode, AppointmentViewType } from "../types.ts";
import { calendarPreferences } from "../calendarPreferences.ts";
import { dispatchSelectDateAndDayView } from "../selectDateAndDayViewDispatch.ts";
import { store } from "../../../app/providers/store";
import EditAppointmentSlider from "../components/EditAppointmentSlider.tsx";
import { AppointmentGrid } from "../components/AppointmentGrid.tsx";
import { listLocationsAction } from "../../locations/actions.ts";
import {
  getAllLocationsSelector,
  getLocationListErrorSelector,
} from "../../locations/selectors.ts";
import { AppointmentBlockOverrideDialog } from "../components/AppointmentBlockOverrideDialog";
import { CustomerOverlapDialog } from "../components/CustomerOverlapDialog";
import { CreateBlockDrawer } from "../components/CreateBlockDrawer.tsx";
import { BlockConflictDialog } from "../components/BlockConflictDialog.tsx";
import { CalendarSidebar } from "../components/CalendarSidebar.tsx";
import { CalendarHeader } from "../components/CalendarHeader.tsx";
import { CalendarSettingsSheet } from "../components/CalendarSettingsSheet.tsx";
import { Card } from "../../../shared/components/ui/card.tsx";
import { useIsMobile } from "../../../shared/hooks/use-mobile.ts";
import { MobileCalendarLayout } from "../components/mobile/MobileCalendarLayout.tsx";
import { ErrorState } from "../../../shared/components/common/ErrorState.tsx";
import { STORAGE_KEY as CALENDAR_LOCATION_STORAGE_KEY } from "../components/LocationSelector.tsx";

/** A link's instant as the calendar day in the venue's timezone (wall date). */
const venueWallDay = (moment: Date): Date =>
  localCalendarDateFromDateKey(formatDateInTimezone(moment, getCalendarTimezone(store.getState())));

const DAY_REFRESH_INTERVAL_MS = 15_000;

const Calendar = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const addFormOpen = useSelector(getAddFormSelector);
  const editForm = useSelector(getEditFormSelector);
  const viewMode: AppointmentViewMode = useSelector(getViewModeSelector);
  const viewType = useSelector(getViewTypeSelector);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const selectedLocationId = useSelector(getSelectedLocationId);
  const locationContext = useSelector(getLocationContext);
  const locationTeamMembers = useSelector(getLocationTeamMembers);
  const locationStaff = useSelector(getLocationStaff);
  const staffFilter = useSelector(getStaffFilter);
  const dayFilters = useSelector(getDayFilters);
  const selectedDate = useSelector(getSelectedDate);
  const displayedWeekStart = useSelector(getDisplayedWeekStart);
  const displayedMonthStart = useSelector(getMonthViewDisplayStart);
  const locationContextError = useSelector(getLocationContextError);
  const summaryError = useSelector(getSummaryError);
  const dayDataError = useSelector(getDayDataError);
  const weekDataError = useSelector(getWeekDataError);
  const summary = useSelector(getCalendarSummary);
  const dayData = useSelector(getDayData);
  const weekData = useSelector(getWeekData);
  const locations = useSelector(getAllLocationsSelector);
  const locationsListError = useSelector(getLocationListErrorSelector);
  const hasRefetchedOnEnter = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation("calendar");
  const viewDataError =
    viewMode === AppointmentViewMode.DAY
      ? dayDataError
      : viewMode === AppointmentViewMode.WEEK
        ? weekDataError
        : summaryError;
  const locationsUnavailable =
    !!locationsListError && locations.length === 0;
  const viewHasData =
    viewMode === AppointmentViewMode.DAY
      ? dayData !== null
      : viewMode === AppointmentViewMode.WEEK
        ? weekData !== null
        : Object.keys(summary).length > 0;
  const calendarLoadError =
    (locationsUnavailable ? locationsListError : null) ??
    (locationContextError && !locationContext ? locationContextError : null) ??
    (viewDataError && !viewHasData ? viewDataError : null);

  const handleRetryCalendarLoad = useCallback(() => {
    if (locationsUnavailable) {
      dispatch(listLocationsAction.request());
      return;
    }

    if (!selectedLocationId) {
      dispatch(listLocationsAction.request());
      return;
    }

    if (locationContextError) {
      dispatch(fetchLocationContext.request(selectedLocationId));
    }
    if (viewDataError) {
      // Re-dispatching the current filters uses the existing view-aware saga
      // without resetting the selected date, view, or filters.
      dispatch(setDayFiltersAction(dayFilters));
    }
  }, [
    dayFilters,
    dispatch,
    locationContextError,
    locationsUnavailable,
    selectedLocationId,
    viewDataError,
  ]);

  /* ── "Today" chip for mobile breadcrumb header ──
   * Track whether the selected day and displayed period are already current. */
  const isOnToday = useMemo(() => {
    const today = minSelectableCalendarDateForTimezone(new Date(), calendarTimezone);
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
  }, [viewMode, selectedDate, displayedWeekStart, displayedMonthStart, calendarTimezone]);

  const handleToday = useCallback(() => {
    const now = new Date();
    const isDayGrid = viewMode !== AppointmentViewMode.MONTH && viewType === AppointmentViewType.GRID;
    const alreadyToday = isDayGrid
      ? wallDateKey(selectedDate) === formatDateInTimezone(now, calendarTimezone)
      : isOnToday;
    if (alreadyToday) {
      // No date change to trigger the normal pulse on the visible day pill.
      window.dispatchEvent(new CustomEvent("calendar:today-pulse"));
    } else {
      const today = minSelectableCalendarDateForTimezone(now, calendarTimezone);
      dispatch(setSelectedDateAction(today));
      dispatch(setDisplayedWeekAction(getWeekStart(today)));
      dispatch(setDisplayedMonthAction(new Date(today.getFullYear(), today.getMonth(), 1)));
    }
    if (isDayGrid) window.dispatchEvent(new Event("calendar:scroll-to-now"));
  }, [dispatch, isOnToday, viewMode, viewType, selectedDate, calendarTimezone]);

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
        <Button
          type="button"
          variant="outline"
          size="sm"
          rounded="full"
          onClick={handleToday}
          className="!min-h-0 gap-1.5 px-3 text-xs font-medium
            animate-in fade-in slide-in-from-right-2 duration-200"
        >
          <CalendarCheck2 className="h-3.5 w-3.5 text-primary" />
          {t("page.header.today")}
        </Button>
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

  const calendarLinkSequence = useRef(0);
  useEffect(() => () => { calendarLinkSequence.current += 1; }, []);

  // Link filters waiting for their location's context (see the apply effect below).
  const pendingCalendarLink = useRef<{
    locationId: number | null;
    date: Date | null;
    serviceId: number | null;
    bundleId: number | null;
    staffEmail: string | null;
  } | null>(null);

  // Deep links into the calendar: `date` and `appointmentUuid` from the dashboard's
  // upcoming list, `appointmentId` from notifications. Handled in one effect and consumed
  // with a surgical delete — two effects each clearing the whole query string would race,
  // the second write resurrecting the param the first had just consumed and re-running it.
  useEffect(() => {
    const dateParam = searchParams.get("date");
    // uuid preferred; the numeric form stays supported for links already in the wild.
    const appointmentRef =
      searchParams.get("appointmentUuid") ?? searchParams.get("appointmentId");
    const hasLinkKeys = ["locationId", "serviceId", "bundleId", "staffEmail"].some((k) =>
      searchParams.has(k),
    );
    if (!dateParam && !appointmentRef && !hasLinkKeys) return;

    const linkSequence = ++calendarLinkSequence.current;
    pendingCalendarLink.current = null;
    const next = new URLSearchParams(searchParams);
    next.delete("date");
    next.delete("appointmentUuid");
    next.delete("appointmentId");
    next.delete("locationId");
    next.delete("serviceId");
    next.delete("bundleId");
    next.delete("staffEmail");
    setSearchParams(next, { replace: true });

    const positiveId = (raw: string | null) => {
      const n = Number(raw);
      return raw && Number.isInteger(n) && n > 0 ? n : null;
    };
    const linkLocationId = positiveId(searchParams.get("locationId"));
    const serviceId = positiveId(searchParams.get("serviceId"));
    const bundleId = positiveId(searchParams.get("bundleId"));
    const staffEmail = searchParams.get("staffEmail");
    const currentLocationId = store.getState().calendarView.selectedLocationId;
    const switchesLocation = linkLocationId !== null && linkLocationId !== currentLocationId;

    // Switching location wipes the context, day data and filters (the date survives), so the
    // location goes first and the day and filters wait for its context in the effect below.
    if (switchesLocation) {
      try {
        localStorage.setItem(CALENDAR_LOCATION_STORAGE_KEY, String(linkLocationId));
      } catch {
        // storage unavailable: the selection still applies for this session
      }
      dispatch(setSelectedLocationAction(linkLocationId));
    }

    // Select the day first — it needs no network, and selecting it is what fetches it
    // (handleSetSelectedDate → refetchCalendarForCurrentView). So the day is right even
    // if the detail request below fails.
    const date = dateParam ? new Date(dateParam) : null;
    const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
    const shownContext = store.getState().calendarView.locationContext;
    const waitsForVenue = switchesLocation || shownContext?.location.id !== currentLocationId;
    if (validDate && !waitsForVenue) {
      dispatchSelectDateAndDayView(
        dispatch,
        venueWallDay(validDate),
        store.getState().calendarView.viewMode,
        store.getState().calendarView.selectedDate,
      );
    }

    const hasProductFilter = serviceId !== null || bundleId !== null;
    if ((waitsForVenue && validDate) || hasProductFilter || staffEmail) {
      pendingCalendarLink.current = {
        locationId: linkLocationId ?? (hasProductFilter ? currentLocationId : null),
        date: waitsForVenue ? validDate : null,
        serviceId,
        bundleId,
        staffEmail,
      };
    }

    if (!appointmentRef) return;

    getAppointmentDetailRequest(appointmentRef)
      .then((appointment) => {
        if (!appointment || calendarLinkSequence.current !== linkSequence) return;
        const day = new Date(appointment.scheduledAt);
        const { selectedLocationId: shownLocationId, viewMode, selectedDate } = store.getState().calendarView;
        const appointmentLocationId = appointment.location?.id || null;
        const waiting = pendingCalendarLink.current;
        if (appointmentLocationId != null && appointmentLocationId !== shownLocationId) {
          // Edit works with the calendar's location, so show the appointment at its own one.
          try {
            localStorage.setItem(CALENDAR_LOCATION_STORAGE_KEY, String(appointmentLocationId));
          } catch {
            // storage unavailable: the selection still applies for this session
          }
          dispatch(setSelectedLocationAction(appointmentLocationId));
          pendingCalendarLink.current = {
            serviceId: null,
            bundleId: null,
            staffEmail: null,
            ...(waiting ?? {}),
            locationId: appointmentLocationId,
            date: day,
          };
        } else if (shownLocationId != null && store.getState().calendarView.locationContext?.location.id !== shownLocationId) {
          pendingCalendarLink.current = {
            serviceId: null,
            bundleId: null,
            staffEmail: null,
            ...waiting,
            locationId: shownLocationId,
            date: day,
          };
        } else {
          // A no-op when `date` already moved us here (same-day guard inside); still does the
          // work for id-only links, which have no date to go on.
          dispatchSelectDateAndDayView(dispatch, venueWallDay(day), viewMode, selectedDate);
        }
        dispatch(toggleEditFormAction({ open: true, item: appointment }));
      })
      .catch(() => {});
  }, [searchParams, setSearchParams, dispatch]);

  useEffect(() => {
    const link = pendingCalendarLink.current;
    if (!link || selectedLocationId == null) return;
    if (link.locationId != null && link.locationId !== selectedLocationId) return;
    if (locationContext?.location.id !== selectedLocationId) return;

    const match = link.staffEmail
      ? locationTeamMembers.find((m) => m.email === link.staffEmail)
      : undefined;
    const hasProductFilter = link.serviceId !== null || link.bundleId !== null;
    // A staffEmail-only link waits until the selected location has that member.
    if (link.staffEmail && !match && !hasProductFilter && link.locationId == null) return;

    pendingCalendarLink.current = null;
    // null current date: always refetch the day against the new location's context.
    if (link.date) {
      dispatchSelectDateAndDayView(dispatch, venueWallDay(link.date), store.getState().calendarView.viewMode, null);
    }
    if (match || hasProductFilter) {
      const selectedFilters = hasProductFilter ? {} : store.getState().calendarView.dayFilters;
      dispatch(setStaffFilter(match ? [match.userId] : []));
      dispatch(
        setDayFiltersAction({
          ...selectedFilters,
          ...(match ? { staffUserIds: [match.userId], staffUserId: undefined, unassignedOnly: undefined } : {}),
          ...(link.serviceId !== null ? { serviceIds: [link.serviceId] } : {}),
          ...(link.bundleId !== null ? { bundleIds: [link.bundleId] } : {}),
        }),
      );
    }
  }, [searchParams, selectedLocationId, locationContext, locationTeamMembers, dispatch]);

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

  // Refetch location context and current view when re-entering the calendar (already have a
  // selected location and cached context).
  //
  // Deliberately NOT setSelectedLocationAction: that action means "the location changed", and
  // its reducer wipes locationContext, dayData, dayFilters and staffFilter. Re-dispatching it
  // for the *same* location silently discarded the user's filters, and — because the wipe is
  // synchronous while the saga that reads the state runs after — left handleSetSelectedLocation
  // computing the fetch range from getCalendarTimezone with locationContext already null. That
  // falls back to the business timezone (or UTC), and since selected dates are browser-local
  // midnight, formatting one in UTC yields the *previous* calendar day for any zone east of it.
  // So returning to a previously selected date requested the wrong day and rendered "nothing
  // scheduled" until you nudged the date, which refetched with the context intact.
  useEffect(() => {
    if (hasRefetchedOnEnter.current) return;
    // Read the store, not this render: a link handled above may have just switched the location
    // or set filters, and this render's values would undo it.
    const { selectedLocationId: id, locationContext: context, dayFilters: filters } = store.getState().calendarView;
    if (id == null) return;
    hasRefetchedOnEnter.current = true;
    // No cached context for this location: a location switch is already loading fresh data.
    if (context?.location.id !== id) return;
    // Refreshes working hours/staff without clearing the cached context...
    dispatch(fetchLocationContext.request(id));
    // ...and re-runs the view-aware fetch for the current date, keeping filters. Same
    // trick handleRetryCalendarLoad uses.
    dispatch(setDayFiltersAction(filters));
  }, [dispatch, selectedLocationId]);

  useEffect(() => {
    if (!selectedLocationId || viewMode !== AppointmentViewMode.DAY) return;

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        dispatch(refreshVisibleDay());
      }
    };
    const timer = window.setInterval(refresh, DAY_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [dispatch, selectedLocationId, viewMode]);

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
      mobileViewport={isMobile}
      headerRightContent={mobileHeaderRight}
      headerTitleOverride={mobileHeaderTitle}
      headerPrevAction={isMobile ? handleMobilePrev : undefined}
      headerNextAction={isMobile ? handleMobileNext : undefined}
    >
      <BusinessSetupGate>
        <>
          {calendarLoadError ? (
            /* The grid is the calendar's primary experience and calendarLoadError
               is only set when the current view has no data to render (retained
               data suppresses it). With a dead grid the sidebar is inert too, so
               one page-scope error replaces the whole interior. */
            <ErrorState
              variant="page"
              body={calendarLoadError}
              onRetry={handleRetryCalendarLoad}
              className={isMobile ? "p-4" : undefined}
            />
          ) : isMobile ? (
            /* ─── Mobile Layout ─── */
            <MobileCalendarLayout
              onOpenSettings={() => setSettingsOpen(true)}
              loadError={calendarLoadError}
              onRetryLoad={handleRetryCalendarLoad}
            />
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
                      {/* calendarLoadError is handled by the page-scope gate above,
                          so this branch always has data to render. */}
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
          <BlockConflictDialog />
          <AppointmentBlockOverrideDialog />
          <CustomerOverlapDialog />
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
