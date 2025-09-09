import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";

const mainState = (state: RootState) => state;

export const getLocationStateSelector = createSelector(mainState, (state) => state.locations);
export const getSetupWizardStateSelector = createSelector(mainState, (state) => state.setupWizard);

export default mainState;