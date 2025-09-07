import type { LocationState } from "./types";

export const selectLocationState = (s: { locations: LocationState }) => s.locations;
export const selectCurrentLocation = (s: { locations: LocationState }) => s.locations.current;
export const selectLocationLoading = (s: { locations: LocationState }) => s.locations.isLoading;
export const selectLocationError = (s: { locations: LocationState }) => s.locations.error;
export const selectAllLocations = (s: { locations: LocationState }) => s.locations.allLocations;


