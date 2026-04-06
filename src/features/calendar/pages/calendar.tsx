import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddAppointmentSlider from '../components/AddAppointmentSlider';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { useDispatch, useSelector } from "react-redux";
import {
  toggleAddForm,
  toggleEditFormAction,
  hydrateCalendarDisplayPreferencesAction,
  setStaffFilter,
  setDayFiltersAction,
  setSelectedLocationAction,
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
} from "../selectors.ts";
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
  const hasRefetchedOnEnter = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Apply saved display preferences without triggering view-mode saga (avoids duplicate week/day/summary fetch when location selection runs next).
    dispatch(
      hydrateCalendarDisplayPreferencesAction({
        viewMode: calendarPreferences.getDefaultViewMode(),
        viewType: calendarPreferences.getDefaultViewType(),
      }),
    );
  }, [dispatch]);

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
    <AppLayout contentClassName="max-w-[2000px]">
      <BusinessSetupGate>
        <>
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

          {/* ─── Drawers / Sliders (portaled) ─── */}
          <AddAppointmentSlider
            isOpen={addFormOpen}
            onClose={() => handleCloseAddForm()}
          />
          <EditAppointmentSlider
            isOpen={editForm.open}
            appointment={editForm.item}
            groupAppointments={editForm.groupAppointments ?? undefined}
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
