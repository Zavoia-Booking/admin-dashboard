import { takeLatest, call, put, all } from "redux-saga/effects";
import { createLocationAction, fetchLocationByIdAction, listLocationsAction, setCurrentLocation, updateLocationAction } from "./actions";
import { createLocationApi, getLocationByIdApi, listLocationsApi, updateLocationApi } from "./api";
import type { LocationType } from "../../shared/types/location";
import type { ActionType } from "typesafe-actions";

function* handleFetchLocationById(action: ActionType<typeof fetchLocationByIdAction.request>) {
  try {
    const location: LocationType = yield call(getLocationByIdApi, action.payload.locationId);
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
    takeLatest(updateLocationAction.request, handleUpdateLocation),
    takeLatest(listLocationsAction.request, handleListLocations),
  ]);
}

function* handleCreateLocation(action: ActionType<typeof createLocationAction.request>) {
  try {
    yield call(createLocationApi, action.payload.location);
    yield put(listLocationsAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to create location";
    yield put(createLocationAction.failure({ message }));
  }
}

function* handleUpdateLocation(action: ActionType<typeof updateLocationAction.request>) {
  try {
    yield call(updateLocationApi, action.payload.location);
    yield put(listLocationsAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to update location";
    yield put(updateLocationAction.failure({ message }));
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
        nextCurrent = locations.find((l: any) => l.id == storedId) || null;
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


