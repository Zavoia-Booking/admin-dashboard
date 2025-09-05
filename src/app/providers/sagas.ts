import { all } from "redux-saga/effects";
import { watchTokenHandler } from "../../features/auth/hydrateSession.saga";
import { authSaga } from "../../features/auth/auth.saga";
import { setupWizardSaga } from "../../features/setupWizard/saga";
import { teamMembersSaga } from "../../features/teamMembers/saga";

export function* rootSaga() {
    yield all([
        watchTokenHandler(),
        authSaga(),
        setupWizardSaga(), 
        teamMembersSaga(),
    ]);
}
