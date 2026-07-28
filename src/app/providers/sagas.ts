import { all, call, spawn } from "redux-saga/effects";
import { watchTokenHandler } from "../../features/auth/hydrateSession.saga";

import { authSaga } from "../../features/auth/auth.saga";
import { setupWizardSaga } from "../../features/setupWizard/saga";
import { teamMembersSaga } from "../../features/teamMembers/saga";
import { locationsSaga } from "../../features/locations/saga";
import { servicesSaga } from "../../features/services/saga.ts";
import { calendarSaga } from "../../features/calendar/saga.ts";
import { assignmentsSaga } from "../../features/assignments/saga";
import { settingsSaga } from "../../features/settings/saga";
import { businessSaga } from "../../features/business/saga";
import { marketplaceSaga } from "../../features/marketplace/saga";
import { websiteSaga } from "../../features/website/saga";
import { customersSaga } from "../../features/customers/saga";
import { bundlesSaga } from "../../features/bundles/saga";
import { categoriesSaga } from "../../features/categories/saga";
import { dashboardSaga } from "../../features/dashboard/saga";
import { notificationsSaga } from "../../features/notifications/saga";
import { reviewsSaga } from "../../features/reviews/saga";
import { supportSaga } from "../../features/support/saga";
import { pushNotificationsSaga } from "../../features/push-notifications/saga";
import { reconciliationSaga } from "../../features/reconciliation/saga";

const featureSagas = [
    watchTokenHandler,
    authSaga,
    setupWizardSaga,
    teamMembersSaga,
    locationsSaga,
    servicesSaga,
    calendarSaga,
    settingsSaga,
    assignmentsSaga,
    businessSaga,
    marketplaceSaga,
    websiteSaga,
    customersSaga,
    bundlesSaga,
    categoriesSaga,
    dashboardSaga,
    notificationsSaga,
    reviewsSaga,
    supportSaga,
    pushNotificationsSaga,
    reconciliationSaga,
];

// Each feature saga runs in its own detached task and restarts if it crashes.
// With a plain all([...]) a single uncaught error in any handler cancels every
// watcher in the app - every later request action flips isLoading with nobody
// left to fetch or fail, freezing all pages in their loading state until reload.
export function* rootSaga() {
    yield all(
        featureSagas.map((saga) =>
            spawn(function* () {
                while (true) {
                    try {
                        yield call(saga);
                        break;
                    } catch (error) {
                        console.error(`[saga] ${saga.name} crashed - restarting`, error);
                    }
                }
            }),
        ),
    );
}
