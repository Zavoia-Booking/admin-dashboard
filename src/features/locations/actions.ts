import { createAsyncAction, createAction } from "typesafe-actions";
import type { LocationType } from "../../shared/types/location";
import type { NewLocationPayload } from "./types";

export const fetchLocationByIdAction = createAsyncAction(
  'locations/FETCH_LOCATION_REQUEST',
  'locations/FETCH_LOCATION_SUCCESS',
  'locations/FETCH_LOCATION_FAILURE',
)<{ locationId: string | number }, { location: LocationType }, { message: string }>();

export const createLocationAction = createAsyncAction(
  'locations/CREATE_LOCATION_REQUEST',
  'locations/CREATE_LOCATION_SUCCESS',
  'locations/CREATE_LOCATION_FAILURE',
)<{ location: NewLocationPayload }, void, { message: string }>();

export const listLocationsAction = createAsyncAction(
  'locations/LIST_LOCATIONS_REQUEST',
  'locations/LIST_LOCATIONS_SUCCESS',
  'locations/LIST_LOCATIONS_FAILURE',
)<void, { locations: LocationType[] }, { message: string }>();

export const setCurrentLocation = createAction(
  'locations/SET_CURRENT_LOCATION',
)<{ location: LocationType | null }>();


