import type { RootState } from "./store";
import { createSelector } from "reselect";

const mainState = (state: RootState) => state;

export const getLocationStateSelector = createSelector(mainState, (state) => state.locations);
export const getSetupWizardStateSelector = createSelector(mainState, (state) => state.setupWizard);
export const getServicesStateSelector = createSelector(mainState, (state) => state.services);
export const getTeamMembersStateSelector = createSelector(mainState, (state) => state.teamMembers);

export default mainState;