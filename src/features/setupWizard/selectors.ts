import { createSelector } from "@reduxjs/toolkit";
import { getSetupWizardStateSelector } from "../../app/providers/selectors";

export const getWizardDataSelector = createSelector(getSetupWizardStateSelector, (state) => {
    return state.data
});
