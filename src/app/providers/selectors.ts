import type { RootState } from "./store";

const mainState = (state: RootState) => state;

export const getLocationStateSelector = createSelector(mainState, (state) => state.locations);
export const getSetupWizardStateSelector = createSelector(mainState, (state) => state.setupWizard);
export const getServicesStateSelector = createSelector(mainState, (state) => state.services);

export default mainState;