import { all, call, put, select, takeLatest } from "redux-saga/effects";
import i18n from "../../shared/lib/i18n";
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
import { listCategoriesAction } from "../categories/actions";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import type { Service } from "../../shared/types/service.ts";
import { getErrorMessage } from "../../shared/utils/error";
import type { RootState } from "../../app/providers/store";

function* handleGetServices(): Generator<any, void, any> {
  // Always fetch the full list; all filtering is handled client-side
  try {
    const response: { data: Service[] } = yield call(getServicesRequest);
    if (response.data) {
      yield put(getServicesAction.success(response.data));
    }
  } catch (error: unknown) {
    console.error("Failed to load services:", error);
    const message = getErrorMessage(error, i18n.t("services:toasts.services.loadFailed"));
    yield put(getServicesAction.failure({ message }));
    const hasRetainedServices: boolean = yield select(
      (state: RootState) => state.services.services.length > 0,
    );
    if (hasRetainedServices) {
      toast.error(message);
    }
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
    console.error("Failed to load service details:", error);
    const message = getErrorMessage(error, i18n.t("services:toasts.services.loadDetailsFailed"));
    toast.error(message);
    yield put(getServiceByIdAction.failure({ message }));
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
      toast.success(i18n.t("services:toasts.services.createSuccess"));
      yield put(getServicesAction.request());
      // Refresh categories in case a new one was created during service creation
      yield put(listCategoriesAction.request());
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
    const response: { data: any } = yield call(
      deleteServiceRequest,
      action.payload.serviceId
    );
    
    // Check if response indicates service cannot be deleted
    const deleteResponse = response.data?.deleteResponse || response.data;
    
    if (deleteResponse?.canDelete === false) {
      // Service has dependencies and cannot be deleted
      yield put(deleteServicesAction.success(deleteResponse));
    } else {
      // Service was successfully deleted
      toast.success(i18n.t("services:toasts.services.deleteSuccess"));
      yield put(deleteServicesAction.success({ canDelete: true, message: i18n.t("services:toasts.services.deleteSuccess") }));
      yield put(getServicesAction.request());
    }
  } catch (error: unknown) {
    console.error("Failed to delete service:", error);
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage || i18n.t("services:toasts.services.deleteFailed"));
    yield put(deleteServicesAction.failure({ message: errorMessage }));
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
      toast.success(i18n.t("services:toasts.services.editSuccess"));
      yield put(editServicesAction.success(response.data));
      yield put(getServicesAction.request());
      // Refresh categories in case a new one was created during service edit
      yield put(listCategoriesAction.request());
    }
  } catch (error: unknown) {
    console.error("Failed to edit service:", error);
    const errorMessage = getErrorMessage(error);
    // Error toast is handled in the component
    yield put(editServicesAction.failure({ message: errorMessage }));
  }
}

function* handleSetServiceFilters(
  action: ActionType<typeof setServiceFilterAction.request>
) {
  // Only update filters in state; do not refetch from backend.
  // Client-side selectors derive filtered views from the full list.
  yield put(setServiceFilterAction.success(action.payload));
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
