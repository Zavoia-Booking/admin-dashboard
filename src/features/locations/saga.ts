import { takeLatest, call, put, all } from "redux-saga/effects";
import { createLocationAction, fetchLocationByIdAction, listLocationsAction, setCurrentLocation } from "./actions";
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

    // After listing, set default current location if missing
    const storedId = localStorage.getItem('currentLocationId');
    let nextCurrent = null as any;
    if (Array.isArray(locations) && locations.length > 0) {
      if (storedId) {
        nextCurrent = locations.find((l: any) => l.id === storedId) || null;
      }
      if (!nextCurrent) {
        nextCurrent = locations.find((l: any) => l.isActive) || locations[0] || null;
      }
    }
    if (nextCurrent) {
      yield put(setCurrentLocation({ location: nextCurrent }));
      try { localStorage.setItem('currentLocationId', nextCurrent.id); } catch {}
    }
  } catch (error: any) {
    yield put(listLocationsAction.failure({ message: error?.message || "Failed to list locations" }));
  }
}


