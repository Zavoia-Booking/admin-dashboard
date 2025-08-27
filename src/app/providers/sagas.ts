import { all } from "redux-saga/effects";
import { authSaga } from "../../features/auth/saga";
import { setupWizardSaga } from "../../features/setupWizard/saga";
import { teamMembersSaga } from "../../features/teamMembers/saga";

export function* rootSaga() {
    yield all([authSaga(), setupWizardSaga(), teamMembersSaga()]);
}
