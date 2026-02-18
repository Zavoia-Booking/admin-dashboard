import { apiClient } from "../../shared/lib/http";
import type { ListNotificationsResponse, MarkReadResponse, MarkAllReadResponse } from "./types";

export const listNotificationsRequest = (offset: number, limit: number) => {
  return apiClient().get<ListNotificationsResponse>(
    `/business-notifications/list?offset=${offset}&limit=${limit}`
  );
};

export const markNotificationReadRequest = (id: number) => {
  return apiClient().patch<MarkReadResponse>(
    `/business-notifications/${id}/read`
  );
};

export const markAllNotificationsReadRequest = () => {
  return apiClient().patch<MarkAllReadResponse>(
    `/business-notifications/read-all`
  );
};
