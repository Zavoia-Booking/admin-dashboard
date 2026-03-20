export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  /** Present on appointment payloads when loaded from API. */
  profileImage?: string | null;
  source: 'manual' | 'marketplace' | 'import';
  status: 'active' | 'blocked' | 'archived';
  conflictStatus: 'none' | 'duplicate_detected' | 'merged' | 'ignored';
  hasConflict: boolean;
  duplicateOfId: number | null;
  notes: string;
  createdAt: string;
  linkedUser: any | null;
}

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

export interface CustomersListResponse {
  data: Customer[];
  pagination: CustomersPagination;
  summary: CustomersSummary;
}
