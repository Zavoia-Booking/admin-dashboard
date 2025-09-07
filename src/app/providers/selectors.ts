import type { RootState } from "./store";
import {createSelector} from "@reduxjs/toolkit";

const mainState = (state: RootState) => state;

export const getServicesStateSelector = createSelector(mainState, (state) => state.services);

export default mainState;