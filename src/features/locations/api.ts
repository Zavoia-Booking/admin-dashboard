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
  const { data } = await apiClient().put<LocationType>(`/locations/${location.id}`, editLocationPayload);
  return data;
}

export const listLocationsApi = async (): Promise<LocationType[]> => {
  const { data } = await apiClient().post<LocationType[]>(`/locations/list`, { filters: [] });
  return data;
}

export const deleteLocationApi = async (id: number): Promise<any> => {
  const { data } = await apiClient().delete(`/locations/${id}`);
  return data;
}

export interface ConfirmMapPinResponse {
  message: string;
  location: {
    id: number;
    name: string;
    address: string;
    addressComponents: {
      city?: string;
      street?: string;
      country?: string;
      postalCode?: string;
      streetNumber?: string;
      latitude: number;
      longitude: number;
    };
    mapPinConfirmed: boolean;
  };
}
