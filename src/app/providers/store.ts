import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "./sagas";
import { AuthReducer } from "../../features/auth/reducer";
import setupWizardReducer from "../../features/setupWizard/reducer";
import teamMembersReducer from "../../features/teamMembers/reducer";
import { LocationsReducer } from "../../features/locations/reducer";
import { initApiClient } from "../../shared/lib/http";
import { initNativeSessionResume } from "../../shared/lib/nativeSessionResume";
import { ServicesReducer } from "../../features/services/reducer.ts";
import { CalendarReducer } from "../../features/calendar/reducer.ts";
import settingsReducer from "../../features/settings/reducer";
import { AssignmentsReducer } from "../../features/assignments/reducer.ts";
import businessReducer from "../../features/business/reducer";
import { MarketplaceReducer } from "../../features/marketplace/reducer";
import { WebsiteReducer } from "../../features/website/reducer";
import { CustomersReducer } from "../../features/customers/reducer";
import { BundlesReducer } from "../../features/bundles/reducer";
import { CategoriesReducer } from "../../features/categories/reducer";
import dashboardReducer from "../../features/dashboard/reducer";
import { NotificationsReducer } from "../../features/notifications/reducer";
import { ReviewsReducer } from "../../features/reviews/reducer";
import { SupportReducer } from "../../features/support/reducer";
import { reconciliationReducer } from "../../features/reconciliation/reducer";
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
    calendarView: CalendarReducer,
    assignments: AssignmentsReducer,
    settings: settingsReducer,
    business: businessReducer,
    marketplace: MarketplaceReducer,
    website: WebsiteReducer,
    customers: CustomersReducer,
    bundles: BundlesReducer,
    categories: CategoriesReducer,
    dashboard: dashboardReducer,
    notifications: NotificationsReducer,
    reviews: ReviewsReducer,
    support: SupportReducer,
    reconciliation: reconciliationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false, // using sagas instead of thunk
      // If your sagas/actions carry non-serializable payloads (e.g., Errors), disable or tune this:
      serializableCheck: false,
      // Ignore immutability check for logoFileBuffer (File objects are intentionally stored here temporarily)
      immutableCheck: {
        ignoredPaths: ['setupWizard.logoFileBuffer'],
      },
    }).concat(sagaMiddleware),
  devTools: import.meta.env.DEV,
});

// --- run root saga ---
sagaMiddleware.run(rootSaga);

// --- init axios client with the store (needed for interceptors to access state/dispatch) ---
initApiClient(store);

// --- native: refresh a stale session when the app returns to the foreground ---
initNativeSessionResume(store);

// --- types ---
export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
