import { useCallback, useEffect } from 'react';
import AddAppointmentSlider from '../components/AddAppointmentSlider';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { useDispatch, useSelector } from "react-redux";
import { fetchCalendarAppointments, toggleAddForm, toggleEditFormAction } from "../actions.ts";
import { AppointmentList } from "../components/AppointmentList.tsx";
import {
  getAddFormSelector,
  getCalendarAppointmentsSelector,
  getEditFormSelector, getFiltersSelectedDate, getViewModeSelector,
  getViewTypeSelector
} from "../selectors.ts";
import { AppointmentViewMode, AppointmentViewType } from "../types.ts";
import { Filters } from "../components/Filters.tsx";
import EditAppointmentSlider from "../components/EditAppointmentSlider.tsx";
import { AppointmentGrid } from "../components/AppointmentGrid.tsx";
import { DateTabs } from "../components/DateTab.tsx";
import { getServicesAction } from "../../services/actions.ts";
import { listLocationsAction } from "../../locations/actions.ts";
import { listTeamMembersAction } from "../../teamMembers/actions.ts";

const Calendar = () => {
  const dispatch = useDispatch();
  const addFormOpen = useSelector(getAddFormSelector);
  const editForm = useSelector(getEditFormSelector);
  const viewType: AppointmentViewType = useSelector(getViewTypeSelector);
  const viewMode: AppointmentViewMode = useSelector(getViewModeSelector);
  const appointments = useSelector(getCalendarAppointmentsSelector);
  const selectedDate = useSelector(getFiltersSelectedDate);

  useEffect(() => {
    dispatch(fetchCalendarAppointments.request())
    dispatch(listTeamMembersAction.request())
    dispatch(listLocationsAction.request())
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
        <Filters appointments={appointments}/>
        <DateTabs/>

        {/* List View Content */}
        {viewType === AppointmentViewType.LIST && (
            <AppointmentList
                viewMode={viewMode}
                appointments={appointments}
            />
        )}

        {/*/!* Grid View - Custom Day Timeline *!/*/}
        {viewType === AppointmentViewType.GRID && (
            <AppointmentGrid
                viewMode={viewMode}
                selectedDate={selectedDate}
                appointments={appointments}
            />
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
      </BusinessSetupGate>
    </AppLayout>
  );
};

export default Calendar;