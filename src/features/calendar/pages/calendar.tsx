import { useCallback, useEffect } from 'react';
import AddAppointmentSlider from '../components/AddAppointmentSlider';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { useDispatch, useSelector } from "react-redux";
import { toggleAddForm, toggleEditFormAction } from "../actions";
import { AppointmentList } from "../components/AppointmentList.tsx";
import {
  getAddFormSelector,
  getEditFormSelector,
  getViewModeSelector,
  getViewTypeSelector,
} from "../selectors.ts";
import { AppointmentViewMode, AppointmentViewType } from "../types.ts";
import { Filters } from "../components/Filters.tsx";
import EditAppointmentSlider from "../components/EditAppointmentSlider.tsx";
import { AppointmentGrid } from "../components/AppointmentGrid.tsx";
import { DateTabs } from "../components/DateTab.tsx";
import { getServicesAction } from "../../services/actions.ts";
import { listLocationsAction } from "../../locations/actions.ts";
import { listTeamMembersAction } from "../../teamMembers/actions.ts";
import { AccessGuard } from "../../../shared/components/guards/AccessGuard.tsx";
import { LocationSelector } from "../components/LocationSelector.tsx";
import { CreateBlockDrawer } from "../components/CreateBlockDrawer.tsx";

const Calendar = () => {
  const dispatch = useDispatch();
  const addFormOpen = useSelector(getAddFormSelector);
  const editForm = useSelector(getEditFormSelector);
  const viewType: AppointmentViewType = useSelector(getViewTypeSelector);
  const viewMode: AppointmentViewMode = useSelector(getViewModeSelector);

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
          {/* Location Selector - primary context for all calendar data */}
          <LocationSelector />

          <Filters />
          <DateTabs/>

          {/* List View Content */}
          {viewType === AppointmentViewType.LIST && (
              <AppointmentList />
          )}

          {/* Grid View - Custom Day Timeline */}
          {viewType === AppointmentViewType.GRID && (
              <AppointmentGrid viewMode={viewMode} />
          )}

          {/* Add Appointment Slider */}
          <AddAppointmentSlider
            isOpen={addFormOpen}
            onClose={() => handleCloseAddForm()}
          />
          <EditAppointmentSlider
            isOpen={editForm.open}
            appointment={editForm.item}
            onClose={handleCloseEditForm}
          />

          {/* Block Creation Drawer */}
          <CreateBlockDrawer />
        </AccessGuard>
      </BusinessSetupGate>
    </AppLayout>
  );
};

export default Calendar;