import type { RootState } from "./store";
import { createSelector } from "reselect";

const mainState = (state: RootState) => state;

export const getLocationStateSelector = createSelector(mainState, (state) => state.locations);
export const getSetupWizardStateSelector = createSelector(mainState, (state) => state.setupWizard);
export const getServicesStateSelector = createSelector(mainState, (state) => state.services);
export const getTeamMembersStateSelector = createSelector(mainState, (state) => state.teamMembers);
export const getCalendarViewStateSelector = createSelector(mainState, (state) => state.calendarView);
export const getSettingsStateSelector = createSelector(mainState, (state) => state.settings);
export const getCustomersStateSelector = createSelector(mainState, (state) => state.customers);
export const getBundlesStateSelector = createSelector(mainState, (state) => state.bundles);

export default mainState;