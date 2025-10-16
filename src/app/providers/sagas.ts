import { all } from "redux-saga/effects";
import { watchTokenHandler } from "../../features/auth/hydrateSession.saga";

import { authSaga } from "../../features/auth/auth.saga";
import { setupWizardSaga } from "../../features/setupWizard/saga";
import { teamMembersSaga } from "../../features/teamMembers/saga";
import { locationsSaga } from "../../features/locations/saga";
import { servicesSaga } from "../../features/services/saga.ts";
import { calendarSaga } from "../../features/calendar/saga.ts";
import { settingsSaga } from "../../features/settings/saga";

export function* rootSaga() {
    yield all([
        watchTokenHandler(),
        authSaga(),
        setupWizardSaga(), 
        teamMembersSaga(),
        locationsSaga(),
        servicesSaga(),
        calendarSaga(),
        settingsSaga(),
    ]);
}
