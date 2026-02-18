import type { CreateBundlePayload, UpdateBundlePayload, Bundle } from "./types.ts";
import { apiClient } from "../../shared/lib/http";

export const listBundlesRequest = () => {
  return apiClient().get<{ bundles: Bundle[] }>("/bundles/list");
};

export const createBundleRequest = (payload: CreateBundlePayload) => {
  return apiClient().post<{ message: string }>("/bundles/create", payload);
};

export const updateBundleRequest = (payload: UpdateBundlePayload) => {
  const { id, ...data } = payload;
  return apiClient().put<{ message: string }>(`/bundles/${id}`, data);
};

export type DeleteBundleResponse = {
  canDelete: boolean;
  message?: string;
  locationsCount?: number;
  appointmentsCount?: number;
};

export const deleteBundleRequest = (id: number) => {
  return apiClient().delete<DeleteBundleResponse>(`/bundles/${id}`);
};

