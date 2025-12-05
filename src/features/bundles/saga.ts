import { all, call, put, takeLatest } from "redux-saga/effects";
import { listBundlesAction, createBundleAction, updateBundleAction, deleteBundleAction } from "./actions.ts";
import { listBundlesRequest, createBundleRequest, updateBundleRequest, deleteBundleRequest } from "./api.ts";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import { getErrorMessage } from "../../shared/utils/error";
import type { Bundle } from "./types.ts";

function* handleListBundles(): Generator<any, void, any> {
  try {
    const response: { data: { bundles: Bundle[] } } = yield call(
      listBundlesRequest
    );
    if (response.data?.bundles) {
      yield put(listBundlesAction.success(response.data.bundles));
    }
  } catch (error: unknown) {
    console.error("Failed to load bundles:", error);
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage || "Failed to load bundles");
    yield put(listBundlesAction.failure({ message: errorMessage }));
  }
}

function* handleCreateBundle(
  action: ActionType<typeof createBundleAction.request>
) {
  try {
    const response: { data: { message: string } } = yield call(
      createBundleRequest,
      action.payload
    );
    if (response.data) {
      toast.success("Bundle created successfully");
      yield put(createBundleAction.success(response.data));
      // Refresh bundles list after creation
      yield put(listBundlesAction.request());
    }
  } catch (error: unknown) {
    console.error("Failed to create bundle:", error);
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage || "Failed to create bundle");
    yield put(createBundleAction.failure({ message: errorMessage }));
  }
}

function* handleUpdateBundle(
  action: ActionType<typeof updateBundleAction.request>
) {
  try {
    const response: { data: { message: string } } = yield call(
      updateBundleRequest,
      action.payload
    );
    if (response.data) {
      toast.success("Bundle updated successfully");
      yield put(updateBundleAction.success(response.data));
      // Refresh bundles list after update
      yield put(listBundlesAction.request());
    }
  } catch (error: unknown) {
    console.error("Failed to update bundle:", error);
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage || "Failed to update bundle");
    yield put(updateBundleAction.failure({ message: errorMessage }));
  }
}

function* handleDeleteBundle(
  action: ActionType<typeof deleteBundleAction.request>
) {
  try {
    const response: { data: { message: string } } = yield call(
      deleteBundleRequest,
      action.payload.id
    );
    if (response.data) {
      toast.success("Bundle deleted successfully");
      yield put(deleteBundleAction.success(response.data));
      // Refresh bundles list after deletion
      yield put(listBundlesAction.request());
    }
  } catch (error: unknown) {
    console.error("Failed to delete bundle:", error);
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage || "Failed to delete bundle");
    yield put(deleteBundleAction.failure({ message: errorMessage }));
  }
}

export function* bundlesSaga(): Generator<unknown, void, unknown> {
  yield all([
    takeLatest(listBundlesAction.request, handleListBundles),
    takeLatest(createBundleAction.request, handleCreateBundle),
    takeLatest(updateBundleAction.request, handleUpdateBundle),
    takeLatest(deleteBundleAction.request, handleDeleteBundle),
  ]);
}

