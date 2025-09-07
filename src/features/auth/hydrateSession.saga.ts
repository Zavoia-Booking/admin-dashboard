import { call, put, takeLatest, select, delay, all } from "redux-saga/effects";
import { refreshSession } from "../../shared/lib/http";
import { hydrateSessionAction, setTokensAction } from "./actions";
import { listLocationsAction } from "../locations/actions";
import type { RootState } from "../../app/providers/store";
// no-op


function* hydrateSessionWorker(): Generator<any, void, any> {
  try {
    // Trigger refresh via single-flight helper (also updates redux)
    // refreshSession already updates Redux state; nothing else needed here
    yield call(refreshSession);
  } catch (e: any) {
    yield put(hydrateSessionAction.failure(e?.message || "Unable to hydrate session"));
  }
}

function* watchHydrateSession(): Generator<any, void, any> {
  yield takeLatest(hydrateSessionAction.request, hydrateSessionWorker);
}

// -------- Proactive refresh (schedule ~60s before exp) --------
function decodeExp(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json?.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

// Reschedules on new tokens and successful hydrate; cancelled on logout by restarting the task
function* scheduleProactiveRefresh(_action?: any): Generator<any, void, any> {
  const accessToken: string | null = yield select((s: RootState) => s.auth.accessToken);
  if (!accessToken) return;

  const exp = decodeExp(accessToken);
  if (!exp) return;

  const msUntil = exp * 1000 - Date.now() - 60_000;
  if (msUntil <= 0) {
    yield put(hydrateSessionAction.request());
    return;
  }
  yield delay(msUntil);
  yield put(hydrateSessionAction.request());
}

function* watchProactiveRefresh(): Generator<any, void, any> {
  // takeLatest cancels the previous scheduled delay when any of these actions fire
  yield takeLatest([
    setTokensAction, 
    hydrateSessionAction.success, 
  ], scheduleProactiveRefresh);
}

export function* watchTokenHandler(): Generator<any, void, any> {
  yield all([
    watchHydrateSession(),
    watchProactiveRefresh(),
    // Also listen for hydrate success and fetch locations to restore current location
    (function* () {
      yield takeLatest(hydrateSessionAction.success, function* () {
        yield put(listLocationsAction.request());
      });
    })(),
  ]);
}

