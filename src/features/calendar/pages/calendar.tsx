import { useCallback, useEffect, useState } from 'react';
import AddAppointmentSlider from '../components/AddAppointmentSlider';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { useDispatch, useSelector } from "react-redux";
import { toggleAddForm, toggleEditFormAction, setViewModeAction, setViewTypeAction } from "../actions";
import {
  getAddFormSelector,
  getEditFormSelector,
  getViewModeSelector,
  getSidebarOpen,
} from "../selectors.ts";
import { AppointmentViewMode } from "../types.ts";
import { calendarPreferences } from "../calendarPreferences.ts";
import EditAppointmentSlider from "../components/EditAppointmentSlider.tsx";
import { AppointmentGrid } from "../components/AppointmentGrid.tsx";
import { getServicesAction } from "../../services/actions.ts";
import { listLocationsAction } from "../../locations/actions.ts";
import { listTeamMembersAction } from "../../teamMembers/actions.ts";
import { AccessGuard } from "../../../shared/components/guards/AccessGuard.tsx";
import { CreateBlockDrawer } from "../components/CreateBlockDrawer.tsx";
import { CalendarSidebar } from "../components/CalendarSidebar.tsx";
import { CalendarHeader } from "../components/CalendarHeader.tsx";
import { CalendarSettingsSheet } from "../components/CalendarSettingsSheet.tsx";
import { Card } from "../../../shared/components/ui/card.tsx";

const Calendar = () => {
  const dispatch = useDispatch();
  const addFormOpen = useSelector(getAddFormSelector);
  const editForm = useSelector(getEditFormSelector);
  const viewMode: AppointmentViewMode = useSelector(getViewModeSelector);
  const sidebarOpen = useSelector(getSidebarOpen);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Apply saved display preferences on calendar load
    dispatch(setViewModeAction(calendarPreferences.getDefaultViewMode()));
    dispatch(setViewTypeAction(calendarPreferences.getDefaultViewType()));
  }, [dispatch]);

  useEffect(() => {
    // Fetch supporting data - locations needed for LocationSelector,
    // team members + services for filters/forms
    dispatch(listLocationsAction.request())
    dispatch(listTeamMembersAction.request())
    dispatch(getServicesAction.request())
  }, [dispatch]);

  const handleCloseAddForm = useCallback(() => {
    dispatch(toggleAddForm({ open: false }))
  },[dispatch])

  const handleCloseEditForm = useCallback(() => {
    dispatch(toggleEditFormAction({ item: null, open: false }))
  },[dispatch])

  return (
    <AppLayout contentClassName="md:max-w-[1400px]">
      <BusinessSetupGate>
        <AccessGuard>
          <div className="flex min-h-[calc(100vh-64px)] items-start">
            {/* ─── Left Sidebar ─── */}
            {sidebarOpen && <CalendarSidebar />}

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex flex-col min-w-0 bg-muted/10 dark:bg-transparent">
              <div className="p-0 md:p-4 lg:p-6 flex flex-col">
                <Card className="flex flex-col border-none shadow-none md:border md:shadow-sm bg-white dark:bg-surface rounded-none md:rounded-xl">
                  {/* Top header bar */}
                  <CalendarHeader onOpenSettings={() => setSettingsOpen(true)} />

                  {/* Content area — height driven by grid/list for single page scroll */}
                  <div className="relative">
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
            onClose={handleCloseEditForm}
          />
          <CreateBlockDrawer />
          <CalendarSettingsSheet
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        </AccessGuard>
      </BusinessSetupGate>
    </AppLayout>
  );
};

export default Calendar;
