import { useCallback, useEffect } from 'react';
import AddAppointmentSlider from '../components/AddAppointmentSlider';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { useDispatch, useSelector } from "react-redux";
import { toggleAddForm, toggleEditFormAction } from "../actions";
import {
  getAddFormSelector,
  getEditFormSelector,
  getViewModeSelector,
  getSidebarOpen,
} from "../selectors.ts";
import { AppointmentViewMode } from "../types.ts";
import EditAppointmentSlider from "../components/EditAppointmentSlider.tsx";
import { AppointmentGrid } from "../components/AppointmentGrid.tsx";
import { getServicesAction } from "../../services/actions.ts";
import { listLocationsAction } from "../../locations/actions.ts";
import { listTeamMembersAction } from "../../teamMembers/actions.ts";
import { AccessGuard } from "../../../shared/components/guards/AccessGuard.tsx";
import { CreateBlockDrawer } from "../components/CreateBlockDrawer.tsx";
import { CalendarSidebar } from "../components/CalendarSidebar.tsx";
import { CalendarHeader } from "../components/CalendarHeader.tsx";
import { Card } from "../../../shared/components/ui/card.tsx";

const Calendar = () => {
  const dispatch = useDispatch();
  const addFormOpen = useSelector(getAddFormSelector);
  const editForm = useSelector(getEditFormSelector);
  const viewMode: AppointmentViewMode = useSelector(getViewModeSelector);
  const sidebarOpen = useSelector(getSidebarOpen);

  useEffect(() => {
    // Fetch supporting data - locations needed for LocationSelector,
    // team members + services for filters/forms
    dispatch(listLocationsAction.request())
    dispatch(listTeamMembersAction.request())
    dispatch(getServicesAction.request())
  }, [dispatch]);

  const handleCloseAddForm = useCallback(() => {
    dispatch(toggleAddForm(false))
  },[dispatch])

  const handleCloseEditForm = useCallback(() => {
    dispatch(toggleEditFormAction({ item: null, open: false }))
  },[dispatch])

  return (
    <AppLayout>
      <BusinessSetupGate>
        <AccessGuard>
          <div className="flex h-[calc(100vh-64px)]">
            {/* ─── Left Sidebar ─── */}
            {sidebarOpen && <CalendarSidebar />}

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex flex-col min-w-0 bg-muted/10 dark:bg-transparent">
              <div className="flex-1 p-0 md:p-4 lg:p-6 overflow-hidden flex flex-col">
                <Card className="flex-1 flex flex-col border-none shadow-none md:border md:shadow-sm bg-white dark:bg-surface overflow-hidden rounded-none md:rounded-xl">
                  {/* Top header bar */}
                  <CalendarHeader />

                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-auto relative">
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
        </AccessGuard>
      </BusinessSetupGate>
    </AppLayout>
  );
};

export default Calendar;
