import { createAsyncAction, createAction } from "typesafe-actions";
import type { Customer, CustomersListResponse } from "../../shared/types/customer";
import type { AddCustomerPayload, EditCustomerPayload, ListCustomersPayload, MergeCustomersPayload } from "./types";

export const fetchCustomerByIdAction = createAsyncAction(
  'customers/FETCH_CUSTOMER_BY_ID_REQUEST',
  'customers/FETCH_CUSTOMER_BY_ID_SUCCESS',
  'customers/FETCH_CUSTOMER_BY_ID_FAILURE',
)<{ id: number }, { customer: Customer }, { message: string }>();

export const clearCurrentCustomerAction = createAction('customers/CLEAR_CURRENT_CUSTOMER')();

export const addCustomerAction = createAsyncAction(
  'customers/ADD_CUSTOMER_REQUEST',
  'customers/ADD_CUSTOMER_SUCCESS',
  'customers/ADD_CUSTOMER_FAILURE',
)<AddCustomerPayload, { customer: Customer }, { message: string }>();

export const updateCustomerAction = createAsyncAction(
  'customers/UPDATE_CUSTOMER_REQUEST',
  'customers/UPDATE_CUSTOMER_SUCCESS',
  'customers/UPDATE_CUSTOMER_FAILURE',
)<EditCustomerPayload, void, { message: string }>();

export const removeCustomerAction = createAsyncAction(
  'customers/REMOVE_CUSTOMER_REQUEST',
  'customers/REMOVE_CUSTOMER_SUCCESS',
  'customers/REMOVE_CUSTOMER_FAILURE',
)<{ id: number }, void, { message: string }>();

export const listCustomersAction = createAsyncAction(
  'customers/LIST_CUSTOMERS_REQUEST',
  'customers/LIST_CUSTOMERS_SUCCESS',
  'customers/LIST_CUSTOMERS_FAILURE',
)<ListCustomersPayload, CustomersListResponse, { message: string }>();

export const mergeCustomerAction = createAsyncAction(
  'customers/MERGE_CUSTOMER_REQUEST',
  'customers/MERGE_CUSTOMER_SUCCESS',
  'customers/MERGE_CUSTOMER_FAILURE',
)<MergeCustomersPayload, void, { message: string }>();

