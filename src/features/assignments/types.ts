import type { FilterItem } from "../../shared/types/common";
import { FilterOperator } from "../../shared/types/common";
import { ALL } from "../../shared/constants.ts";

export type Assignment = {
  id: number;
  title: string;
  assigneeName: string;
  assigneeEmail?: string;
  status: "open" | "in_progress" | "completed" | "archived";
  dueDate?: string | null;
  locationName?: string | null;
  createdAt?: string;
};

export type AssignmentItem = {
  id: number,
  service: any,
  user: any,
  customDuration: number | null
  customPrice: number | null
}

export type AssignmentGroup = {
  service: any
  assignees: Array<any>
}

export type AssignmentSummary = {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
};

export type AssignmentFilterState = {
  serviceId: number | string;
};

export type TeamMemberAssignment = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  allServices?: Array<{
    serviceId: number;
    serviceName: string;
  }>;
  allLocations?: Array<{
    locationId: number;
    locationName: string;
  }>;
  assignedServices: Array<{
    serviceId: number;
    serviceName: string;
    customPrice: number | null;
    customDuration: number | null;
  }>;
  assignedLocations: Array<{
    locationId: number;
    locationName: string;
    address: string;
  }>;
};

export type ServiceAssignment = {
  serviceId: number;
  serviceName: string;
  price: number;
  duration: number;
  assignedTeamMembers: Array<{
    userId: number;
    name: string;
    email: string;
    customPrice: number | null;
    customDuration: number | null;
  }>;
  availableLocations: Array<{
    locationId: number;
    locationName: string;
  }>;
};

export type LocationAssignment = {
  locationId: number;
  locationName: string;
  address: string;
  assignedTeamMembers: Array<{
    userId: number;
    name: string;
    email: string;
    role: string;
  }>;
  offeredServices: Array<{
    serviceId: number;
    serviceName: string;
  }>;
};

export type BulkAssignmentPayload = {
  type: 'service_to_locations' | 'team_member_to_services' | 'team_member_to_locations' | 'service_to_team_members';
  sourceId: number;
  targetIds: number[];
};

export type AssignmentsState = {
  // Selected item in left panel
  selectedTeamMemberId: number | null;
  
  // Data for team members
  teamMemberAssignments: TeamMemberAssignment[];
  selectedTeamMemberAssignment: TeamMemberAssignment | null;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
};

export function mapAssignmentFiltersToGeneric(filters: AssignmentFilterState): Array<FilterItem> {
  const items: Array<FilterItem> = [];
  const { serviceId } = filters;

  if (serviceId !== "all") {
    items.push({ field: 'service.id', operator: FilterOperator.EQUALS, value: Number(serviceId) });
  }
  return items;
}

export function getDefaultAssignmentFilters(): AssignmentFilterState {
  return {
    serviceId: ALL,
  };
}

export type GetAssignmentSuccessResponse = {
  summary: AssignmentSummary;
  assignments: Assignment[]
}

export type AssignmentFormData = {
  serviceId: number | null;
  userId: number | null;
  customPrice: boolean;
  customDuration: boolean;
  customPriceValue: number;
  customDurationValue: number;
}

export type AssignmentRequestPayload = {
  serviceId: number;
  userId: number;
  customPrice: number | null;
  customDuration: number | null;
}