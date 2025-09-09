import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "./sagas";
import { AuthReducer } from "../../features/auth/reducer";
import setupWizardReducer from "../../features/setupWizard/reducer";
import teamMembersReducer from "../../features/teamMembers/reducer";
import { LocationsReducer } from "../../features/locations/reducer";
import { initApiClient } from "../../shared/lib/http";
import { ServicesReducer } from "../../features/services/reducer.ts";
// --- create saga middleware ---
const sagaMiddleware = createSagaMiddleware();

// --- configure store ---
export const store = configureStore({
  reducer: {
    auth: AuthReducer,
    setupWizard: setupWizardReducer,
    teamMembers: teamMembersReducer,
    locations: LocationsReducer,
    services: ServicesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false, // using sagas instead of thunk
      // If your sagas/actions carry non-serializable payloads (e.g., Errors), disable or tune this:
      serializableCheck: false,
    }).concat(sagaMiddleware),
  devTools: import.meta.env.DEV,
});

// --- run root saga ---
sagaMiddleware.run(rootSaga);

// --- init axios client with the store (needed for interceptors to access state/dispatch) ---
initApiClient(store);

// --- types ---
export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
