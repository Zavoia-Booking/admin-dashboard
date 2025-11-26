import type { Customer, CustomersListResponse } from "../../shared/types/customer";
import type { AddCustomerPayload, EditCustomerPayload, ListCustomersPayload } from "./types";
import { apiClient } from "../../shared/lib/http";

export const fetchCustomerByIdApi = async (id: number): Promise<Customer> => {
  const { data } = await apiClient().get<Customer>(`/business-customers/${id}`);
  return data;
};

export const addCustomerApi = async (payload: AddCustomerPayload): Promise<Customer> => {
  const { data } = await apiClient().post<Customer>('/business-customers/add-manually', payload);
  return data;
};

export const updateCustomerApi = async (payload: EditCustomerPayload): Promise<Customer> => {
  const { id, ...updateData } = payload;
  const { data } = await apiClient().post<Customer>(`/business-customers/edit/${id}`, updateData);
  return data;
};

export const removeCustomerApi = async (id: number): Promise<void> => {
  await apiClient().post(`/business-customers/remove/${id}`);
};

export const listCustomersApi = async (payload: ListCustomersPayload): Promise<CustomersListResponse> => {
  const { data } = await apiClient().post<CustomersListResponse>('/business-customers/list', payload);
  return data;
};

