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