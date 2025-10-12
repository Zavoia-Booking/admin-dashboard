import type { FilterItem } from "../../shared/types/common";
import { FilterOperator } from "../../shared/types/common";

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
  status: "all" | "open" | "in_progress" | "completed" | "archived";
  search: string;
  locationId: number | "all";
};

export type AssignmentsState = {
  assignments: AssignmentGroup[];
  summary: AssignmentSummary | null;
  filters: AssignmentFilterState;
  addForm: {
    open: boolean
  },
  editForm: {
    open: boolean,
    item: AssignmentItem | null,
  },
  viewDetailsPopup: {
    open: boolean,
    item: Array<AssignmentItem>
  }
};

export function mapAssignmentFiltersToGeneric(filters: AssignmentFilterState): Array<FilterItem> {
  const items: Array<FilterItem> = [];
  const { status, search, locationId } = filters;
  if (search.trim().length > 0) {
    items.push({ field: 'assignment.title', operator: FilterOperator.CONTAINS, value: search.trim() });
  }
  if (status !== "all") {
    items.push({ field: 'assignment.status', operator: FilterOperator.EQUALS, value: status });
  }
  if (locationId !== "all") {
    items.push({ field: 'assignment.locationId', operator: FilterOperator.EQUALS, value: Number(locationId) });
  }
  return items;
}

export function getDefaultAssignmentFilters(): AssignmentFilterState {
  return {
    status: "all",
    search: "",
    locationId: "all",
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