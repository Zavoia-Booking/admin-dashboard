import type { Customer } from "../../shared/types/customer";

export interface CustomersPagination {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface CustomersSummary {
  total: number;
  active: number;
  duplicates: number;
}

export interface CustomerState {
  isLoading: boolean;
  error: string | null;
  customers: Customer[];
  currentCustomer: Customer | null;
  isFetchingCustomer: boolean;
  isRemoving: boolean;
  isMerging: boolean;
  pagination: CustomersPagination | null;
  summary: CustomersSummary | null;
}

export interface AddCustomerPayload {
  email?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  notes?: string;
}

export interface EditCustomerPayload {
  id: number;
  email?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  notes?: string;
}

export interface CustomerFilter {
  field: string;
  operator: string;
  value: string;
}

export interface ListCustomersPayload {
  search?: string;
  filters: CustomerFilter[];
  pagination: {
    offset: number;
    limit: number;
  };
}

export interface CustomerPickerSearchPayload {
  search?: string;
  offset?: number;
  limit?: number;
}

export interface CustomerPickerSearchResponse {
  data: Array<Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>>;
  pagination: CustomersPagination;
}

export interface MergeCustomersPayload {
  sourceId: number;
}
