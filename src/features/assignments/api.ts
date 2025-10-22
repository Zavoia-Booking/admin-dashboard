import { apiClient } from "../../shared/lib/http";
import type { Assignment, AssignmentRequestPayload, AssignmentSummary } from "./types";
import type { FilterItem } from "../../shared/types/common";

export const listAssignmentsRequest = async (filters: Array<FilterItem>) => {
  const { data } = await apiClient().post<{ summary: AssignmentSummary; assignments: Assignment[] }>(
    "/assignments/list",
    { filters }
  );
  return data;
};

export const createAssignmentRequest = async (payload: AssignmentRequestPayload) => {
  const { data } = await apiClient().post(
    "/assignments",
    payload
  );
  return data;
};

export const getAssignmentsByIdRequest = async (serviceId: number) => {
  const { data } = await apiClient().get(
      `/assignments/service/${serviceId}/users`,
  );
  return data;
};

export const deleteAssignmentRequest = async (serviceId: number, userId: number) => {
  const { data } = await apiClient().delete(
      `/assignments/user/${userId}/service/${serviceId}`,
  );
  return data;
};

export const editAssignmentRequest = async (payload: AssignmentRequestPayload) => {
  const { data } = await apiClient().post(
      "/assignments/edit",
      payload
  );
  return data;
};


