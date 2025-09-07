import { takeLatest, call, put, all } from "redux-saga/effects";
import { createLocationAction, fetchLocationByIdAction, listLocationsAction } from "./actions";
import { createLocationApi, getLocationByIdApi, listLocationsApi } from "./api";

function* handleFetchLocationById(action: { type: string; payload: { locationId: string | number } }): Generator<any, void, any> {
  try {
    const location = yield call(getLocationByIdApi, action.payload.locationId);
    yield put(fetchLocationByIdAction.success({ location }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to fetch location";
    yield put(fetchLocationByIdAction.failure({ message }));
  }
}

export function* locationsSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(fetchLocationByIdAction.request, handleFetchLocationById),
    takeLatest(createLocationAction.request, handleCreateLocation),
    takeLatest(listLocationsAction.request, handleListLocations),
  ]);
}
function* handleCreateLocation(action: { type: string; payload: { location: any } }): Generator<any, void, any> {
  try {
    yield call(createLocationApi, action.payload.location);
    yield put(listLocationsAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to create location";
    yield put(createLocationAction.failure({ message }));
  }
}

function* handleListLocations(): Generator<any, void, any> {
  try {
    const { locations } = yield call(listLocationsApi);
    yield put(listLocationsAction.success({ locations }));
  } catch (error: any) {
    yield put(listLocationsAction.failure({ message: error?.message || "Failed to list locations" }));
  }
}


