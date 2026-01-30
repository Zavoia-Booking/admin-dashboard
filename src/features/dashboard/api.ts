import { apiClient } from "../../shared/lib/http";
import type { DashboardApiResponse } from "./actions";

interface DashboardApiWrapper {
  message: string;
  data: DashboardApiResponse;
}

export const fetchDashboardData = async (locationId: number): Promise<DashboardApiResponse> => {
  const { data } = await apiClient().get<DashboardApiWrapper>(`/dashboard/${locationId}`);
  return data.data;
};
