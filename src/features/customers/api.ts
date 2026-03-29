import type {
  Customer,
  CustomerHistoryResponse,
  CustomersListResponse,
  FullActivityItem,
} from "../../shared/types/customer";
import type {
  AddCustomerPayload,
  CustomerPickerSearchPayload,
  CustomerPickerSearchResponse,
  EditCustomerPayload,
  ListCustomersPayload,
} from "./types";
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

export const searchCustomersForPickerApi = async (
  payload: CustomerPickerSearchPayload,
  options?: { signal?: AbortSignal },
): Promise<CustomerPickerSearchResponse> => {
  const { data } = await apiClient().post<CustomerPickerSearchResponse>('/business-customers/picker-search', payload, {
    signal: options?.signal,
  });
  return data;
};

export const mergeCustomersApi = async (marketplaceCustomerId: number): Promise<void> => {
  await apiClient().post('/business-customers/merge', { marketplaceCustomerId });
};

export const fetchCustomerHistoryApi = async (
  customerId: number,
  params?: { offset: number; limit: number },
): Promise<CustomerHistoryResponse> => {
  const { data } = await apiClient().get<CustomerHistoryResponse>(
    `/business-customers/${customerId}/history`,
    { params },
  );
  return data;
};

/** Loads every history page until `hasMore` is false (same JSON endpoint as the list). */
export const fetchAllCustomerHistoryApi = async (customerId: number): Promise<FullActivityItem[]> => {
  const pageSize = 100;
  const all: FullActivityItem[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const res = await fetchCustomerHistoryApi(customerId, { offset, limit: pageSize });
    all.push(...res.data);
    hasMore = res.pagination.hasMore;
    offset = res.pagination.offset + res.pagination.limit;
  }
  return all;
};

