import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
  createServicesAction,
  deleteServicesAction,
  editServicesAction,
  getServicesAction,
  getServiceByIdAction,
  setServiceFilterAction,
} from "./actions.ts";
import {
  createServicesRequest,
  deleteServiceRequest,
  editServicesRequest,
  getServicesRequest,
  getServiceByIdRequest,
} from "./api.ts";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import type { Service } from "../../shared/types/service.ts";
import type { ServiceFilterState } from "./types.ts";
import { getServicesFilterSelector } from "./selectors.ts";
import { mapToGenericFilter } from "./utils.ts";
import { getErrorMessage } from "../../shared/utils/error";

function* handleGetServices(): Generator<any, void, any> {
  const filters: ServiceFilterState = yield select(getServicesFilterSelector);
  const mappedFilters = mapToGenericFilter(filters);

  try {
    const response: { data: Service[] } = yield call(
      getServicesRequest,
      mappedFilters
    );
    if (response.data) {
      yield put(getServicesAction.success(response.data));
    }
  } catch (error: unknown) {
    console.log(error);
    toast.error("Failed to load services");
  }
}

function* handleGetServiceById(
  action: ActionType<typeof getServiceByIdAction.request>
) {
  try {
    const response: { data: Service } = yield call(
      getServiceByIdRequest,
      action.payload
    );
    if (response.data) {
      yield put(getServiceByIdAction.success(response.data));
    }
  } catch (error: unknown) {
    console.log(error);
    toast.error("Failed to load service details");
  }
}

function* handleCreateServices(
  action: ActionType<typeof createServicesAction.request>
) {
  try {
    const response: { data: { message: string } } = yield call(
      createServicesRequest,
      action.payload
    );
    if (response.data) {
      toast.success("Service created successfully");
      yield put(getServicesAction.request({ reset: true }));
      yield put(createServicesAction.success(response.data));
    }
  } catch (error: unknown) {
    console.error("Failed to create service:", error);
    const errorMessage = getErrorMessage(error);
    // Error toast is handled in the component
    yield put(createServicesAction.failure({ message: errorMessage }));
  }
}

function* handleDeleteService(
  action: ActionType<typeof deleteServicesAction.request>
) {
  try {
    const response: { data: unknown } = yield call(
      deleteServiceRequest,
      action.payload.serviceId
    );
    if (response.data) {
      toast.success("Service deleted successfully");
      yield put(getServicesAction.request({ reset: true }));
    }
  } catch {
    toast.error("Failed to delete service");
  }
}

function* handleEditServices(
  action: ActionType<typeof editServicesAction.request>
) {
  try {
    const { id, ...editPayload } = action.payload;

    const response: { data: unknown } = yield call(
      editServicesRequest,
      id,
      editPayload
    );
    if (response.data) {
      toast.success("Service edited successfully");
      yield put(getServicesAction.request({ reset: true }));
    }
  } catch (error: unknown) {
    console.error("Failed to edit service:", error);
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage);
  }
}

function* handleSetServiceFilters(
  action: ActionType<typeof setServiceFilterAction.request>
) {
  yield put(setServiceFilterAction.success(action.payload));
  yield put(getServicesAction.request({ reset: true }));
}

export function* servicesSaga(): Generator<unknown, void, unknown> {
  yield all([
    takeLatest(getServicesAction.request, handleGetServices),
    takeLatest(getServiceByIdAction.request, handleGetServiceById),
    takeLatest(createServicesAction.request, handleCreateServices),
    takeLatest(editServicesAction.request, handleEditServices),
    takeLatest(deleteServicesAction.request, handleDeleteService),
    takeLatest(setServiceFilterAction.request, handleSetServiceFilters),
  ]);
}
