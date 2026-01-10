import { takeLatest, call, put, all } from "redux-saga/effects";
import { fetchCustomerByIdAction, addCustomerAction, updateCustomerAction, removeCustomerAction, listCustomersAction } from "./actions";
import { fetchCustomerByIdApi, addCustomerApi, updateCustomerApi, removeCustomerApi, listCustomersApi } from "./api";
import type { Customer, CustomersListResponse } from "../../shared/types/customer";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";

function* handleFetchCustomerById(action: ActionType<typeof fetchCustomerByIdAction.request>) {
  try {
    const customer: Customer = yield call(fetchCustomerByIdApi, action.payload.id);
    yield put(fetchCustomerByIdAction.success({ customer }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to fetch customer";
    yield put(fetchCustomerByIdAction.failure({ message }));
  }
}

function* handleAddCustomer(action: ActionType<typeof addCustomerAction.request>) {
  try {
    const customer: Customer = yield call(addCustomerApi, action.payload);
    yield put(addCustomerAction.success({ customer }));
    toast.success('Customer added successfully');
    // Refresh the list after adding
    yield put(listCustomersAction.request({ 
      filters: [], 
      pagination: { offset: 0, limit: 20 } 
    }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to add customer";
    yield put(addCustomerAction.failure({ message }));
  }
}

function* handleUpdateCustomer(action: ActionType<typeof updateCustomerAction.request>) {
  try {
    yield call(updateCustomerApi, action.payload);
    yield put(updateCustomerAction.success());
    toast.success('Customer updated successfully');
    // Refresh the list after updating
    yield put(listCustomersAction.request({ 
      filters: [], 
      pagination: { offset: 0, limit: 20 } 
    }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to update customer";
    yield put(updateCustomerAction.failure({ message }));
  }
}

function* handleRemoveCustomer(action: ActionType<typeof removeCustomerAction.request>) {
  try {
    yield call(removeCustomerApi, action.payload.id);
    yield put(removeCustomerAction.success());
    toast.success('Customer removed successfully');
    // Refresh the list after removing
    yield put(listCustomersAction.request({ 
      filters: [], 
      pagination: { offset: 0, limit: 20 } 
    }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to remove customer";
    yield put(removeCustomerAction.failure({ message }));
  }
}

function* handleListCustomers(action: ActionType<typeof listCustomersAction.request>): Generator<any, void, any> {
  try {
    const response: CustomersListResponse = yield call(listCustomersApi, action.payload);
    yield put(listCustomersAction.success(response));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to list customers";
    yield put(listCustomersAction.failure({ message }));
  }
}

export function* customersSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(fetchCustomerByIdAction.request, handleFetchCustomerById),
    takeLatest(addCustomerAction.request, handleAddCustomer),
    takeLatest(updateCustomerAction.request, handleUpdateCustomer),
    takeLatest(removeCustomerAction.request, handleRemoveCustomer),
    takeLatest(listCustomersAction.request, handleListCustomers),
  ]);
}

