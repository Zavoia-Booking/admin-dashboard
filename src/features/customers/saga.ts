import { takeLatest, call, put, all } from "redux-saga/effects";
import { fetchCustomerByIdAction, addCustomerAction, updateCustomerAction, removeCustomerAction, mergeCustomerAction, listCustomersAction } from "./actions";
import { fetchCustomerByIdApi, addCustomerApi, updateCustomerApi, removeCustomerApi, mergeCustomersApi, listCustomersApi } from "./api";
import type { Customer, CustomersListResponse } from "../../shared/types/customer";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import i18n from "../../shared/lib/i18n";
import { getErrorMessage } from "../../shared/utils/error";

function* handleFetchCustomerById(action: ActionType<typeof fetchCustomerByIdAction.request>) {
  try {
    const customer: Customer = yield call(fetchCustomerByIdApi, action.payload.id);
    yield put(fetchCustomerByIdAction.success({ customer }));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(fetchCustomerByIdAction.failure({ message }));
  }
}

function* handleAddCustomer(action: ActionType<typeof addCustomerAction.request>) {
  try {
    const customer: Customer = yield call(addCustomerApi, action.payload);
    yield put(addCustomerAction.success({ customer }));
    toast.success(i18n.t('toasts.addSuccess', { ns: 'customers' }));
    // Refresh the list after adding
    yield put(listCustomersAction.request({ 
      filters: [], 
      pagination: { offset: 0, limit: 20 } 
    }));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(addCustomerAction.failure({ message }));
  }
}

function* handleUpdateCustomer(action: ActionType<typeof updateCustomerAction.request>) {
  try {
    yield call(updateCustomerApi, action.payload);
    yield put(updateCustomerAction.success());
    toast.success(i18n.t('toasts.updateSuccess', { ns: 'customers' }));
    // Refresh the list after updating
    yield put(listCustomersAction.request({ 
      filters: [], 
      pagination: { offset: 0, limit: 20 } 
    }));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(updateCustomerAction.failure({ message }));
  }
}

function* handleRemoveCustomer(action: ActionType<typeof removeCustomerAction.request>) {
  try {
    yield call(removeCustomerApi, action.payload.id);
    yield put(removeCustomerAction.success());
    toast.success(i18n.t('toasts.removeSuccess', { ns: 'customers' }));
    // Refresh the list after removing
    yield put(listCustomersAction.request({ 
      filters: [], 
      pagination: { offset: 0, limit: 20 } 
    }));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(removeCustomerAction.failure({ message }));
  }
}

function* handleMergeCustomer(action: ActionType<typeof mergeCustomerAction.request>) {
  try {
    yield call(mergeCustomersApi, action.payload.sourceId);
    yield put(mergeCustomerAction.success());
    toast.success(i18n.t('toasts.mergeSuccess', { ns: 'customers' }));
    // Refresh the list after merging
    yield put(listCustomersAction.request({ 
      filters: [], 
      pagination: { offset: 0, limit: 20 } 
    }));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(mergeCustomerAction.failure({ message }));
  }
}

function* handleListCustomers(action: ActionType<typeof listCustomersAction.request>): Generator<any, void, any> {
  try {
    const response: CustomersListResponse = yield call(listCustomersApi, action.payload);
    yield put(listCustomersAction.success(response));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(listCustomersAction.failure({ message }));
  }
}

export function* customersSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(fetchCustomerByIdAction.request, handleFetchCustomerById),
    takeLatest(addCustomerAction.request, handleAddCustomer),
    takeLatest(updateCustomerAction.request, handleUpdateCustomer),
    takeLatest(removeCustomerAction.request, handleRemoveCustomer),
    takeLatest(mergeCustomerAction.request, handleMergeCustomer),
    takeLatest(listCustomersAction.request, handleListCustomers),
  ]);
}

