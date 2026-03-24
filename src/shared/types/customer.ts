export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  /** Present on appointment payloads when loaded from API. */
  profileImage?: string | null;
  source: 'manual' | 'marketplace' | 'import';
  status: 'active' | 'blocked' | 'archived' | 'merged';
  conflictStatus: 'none' | 'duplicate_detected' | 'merged' | 'ignored';
  hasConflict: boolean;
  duplicateOfId: number | null;
  notes: string;
  createdAt: string;
  linkedUser: any | null;
  mergedIntoCustomerId: number | null;
  mergedAt: string | null;
  mergedByUserId: number | null;
  recentActivity?: RecentActivityItem[];
}

export interface RecentActivityItem {
  type: 'appointment' | 'milestone';
  label: string;
  status: string | null;
  date: string;
}

export interface AppointmentActivityMetadata {
  appointmentId: number;
  serviceName: string;
  locationName: string | null;
  duration: number;
  price: number;
  currency: string;
}

export interface MilestoneActivityMetadata {
  source: string;
}

export interface FullActivityItem extends RecentActivityItem {
  createdAt: string;
  metadata: AppointmentActivityMetadata | MilestoneActivityMetadata;
}

export interface CustomerHistoryResponse {
  data: FullActivityItem[];
  pagination: CustomersPagination;
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
