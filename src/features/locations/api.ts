import type { LocationType } from "../../shared/types/location";
import type { EditLocationType, EditLocationWorkingHours } from "./types";
import type { NewLocationPayload } from "./types";
import { apiClient } from "../../shared/lib/http";

export const getLocationByIdApi = async (locationId: string | number): Promise<LocationType> => {
  const { data } = await apiClient().get<LocationType>(`/locations/${locationId}`);
  return data;
}

export const createLocationApi = async (location: NewLocationPayload): Promise<LocationType> => {
  const { data } = await apiClient().post<LocationType>(`/locations/create`, location);
  return data;
}

export const updateLocationApi = async (location: EditLocationType | EditLocationWorkingHours): Promise<LocationType> => {
  const { id, ...editLocationPayload } = location;
  const { data } = await apiClient().post<LocationType>(`/locations/edit/${location.id}`, editLocationPayload);
  return data;
}

export const listLocationsApi = async (): Promise<LocationType[]> => {
  const { data } = await apiClient().get<LocationType[]>(`/locations/list`);
  return data;
}

