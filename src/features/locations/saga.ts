import { takeLatest, call, put, all } from "redux-saga/effects";
import i18n from "../../shared/lib/i18n";
import { createLocationAction, deleteLocationAction, fetchLocationByIdAction, listLocationsAction, setLocationHoursConflictOffer, updateLocationAction } from "./actions";
import { createLocationApi, deleteLocationApi, getLocationByIdApi, listLocationsApi, updateLocationApi } from "./api";
import type { LocationType } from "../../shared/types/location";
import type { BlockConflictAppointment } from "../../shared/types/calendar";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import type { DeleteResponse } from "../../shared/types/delete-response";
import { getErrorMessage } from "../../shared/utils/error";

function* handleFetchLocationById(action: ActionType<typeof fetchLocationByIdAction.request>): Generator<any, void, any> {
  try {
    const location: LocationType = yield call(getLocationByIdApi, action.payload.locationId);
    yield put(fetchLocationByIdAction.success({ location }));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(fetchLocationByIdAction.failure({ message }));
  }
}

export function* locationsSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(fetchLocationByIdAction.request, handleFetchLocationById),
    takeLatest(createLocationAction.request, handleCreateLocation),
    takeLatest(updateLocationAction.request, handleUpdateLocation),
    takeLatest(listLocationsAction.request, handleListLocations),
    takeLatest(deleteLocationAction.request, handleDeleteLocation),
  ]);
}

function* handleCreateLocation(action: ActionType<typeof createLocationAction.request>): Generator<any, void, any> {
  try {
    yield call(createLocationApi, action.payload.location);
    yield put(createLocationAction.success());
    toast.success(i18n.t("locations:toasts.createSuccess"));
    yield put(listLocationsAction.request());
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(createLocationAction.failure({ message }));
    toast.error(i18n.t("locations:addLocation.toasts.createFailed"), {
      description: i18n.t("locations:addLocation.toasts.createFailedDescription"),
    });
  }
}

/** 409 details when new hours leave upcoming appointments outside them: how many and the soonest one, else null. */
function hoursConflictFromError(error: any): { total: number; firstAppointment: BlockConflictAppointment | null } | null {
  const details = error?.response?.data?.details;
  if (error?.response?.status !== 409 || details?.conflictType !== 'appointments') return null;
  if (typeof details.total !== 'number') return null;
  return { total: details.total, firstAppointment: details.firstAppointment ?? null };
}

function* handleUpdateLocation(action: ActionType<typeof updateLocationAction.request>): Generator<any, void, any> {
  try {
    const response: any = yield call(updateLocationApi, action.payload.location);
    yield put(updateLocationAction.success({ updateResponse: response }));
    toast.success(i18n.t("locations:toasts.updateSuccess"));
    yield put(listLocationsAction.request());
  } catch (error: unknown) {
    const conflict = hoursConflictFromError(error);
    if (conflict) {
      yield put(setLocationHoursConflictOffer({ payload: action.payload.location, ...conflict }));
      return;
    }
    const message = getErrorMessage(error);
    yield put(updateLocationAction.failure({ message }));
    toast.error(i18n.t("locations:editLocation.toasts.updateFailed"), {
      description: i18n.t("locations:editLocation.toasts.updateFailedDescription"),
    });
  }
}

function* handleListLocations(): Generator<any, void, any> {
  try {
    const { locations } = yield call(listLocationsApi);
    yield put(listLocationsAction.success({ locations }));
  } catch (error: unknown) {
    yield put(listLocationsAction.failure({ message: getErrorMessage(error) }));
  }
}

function* handleDeleteLocation(action: ActionType<typeof deleteLocationAction.request>): Generator<any, void, any> {
  try {
    const response: DeleteResponse = yield call(deleteLocationApi, action.payload.id);
    
    // Check if backend returned validation info (can't delete due to dependencies)
    if (response && response.canDelete === false) {
      // Cannot delete - return blocking info
      yield put(deleteLocationAction.success({ deleteResponse: response }));
    } else {
      // Successfully deleted
      yield put(deleteLocationAction.success({ deleteResponse: { canDelete: true } }));
      toast.success(i18n.t("locations:toasts.deleteSuccess"));
      yield put(listLocationsAction.request());
    }
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    toast.error(message);
    yield put(deleteLocationAction.failure({ message }));
  }
}

