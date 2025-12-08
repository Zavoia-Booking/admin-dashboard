import type { ServiceFilterState, ServicesState } from "./types.ts";
import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { Reducer } from "redux";
import type { Service } from "../../shared/types/service.ts";
import { getDefaultServiceFilters } from "./utils.ts";
import { toggleAddFormAction } from "./actions";

type Actions = ActionType<typeof actions>;

const initialState: ServicesState = {
  services: [],
  filters: getDefaultServiceFilters(),
  addFormOpen: false,
  editForm: {
    open: false,
    item: null,
  },
  error: null,
  isLoading: false,
  isDeleting: false,
  deleteError: null,
  deleteResponse: null,
};

const handleGetServiceByIdSuccess = (
  state: ServicesState,
  payload: Service
): ServicesState => {
  // Update the service in the list if it exists, otherwise add it
  const existingIndex = state.services.findIndex((s) => s.id === payload.id);
  const updatedServices =
    existingIndex >= 0
      ? state.services.map((s, idx) => (idx === existingIndex ? payload : s))
      : [...state.services, payload];

  return {
    ...state,
    services: updatedServices,
    editForm: {
      ...state.editForm,
      item: payload,
    },
  };
};

export const handleSetServiceFilters = (
  state: ServicesState,
  payload: ServiceFilterState
): ServicesState => {
  return {
    ...state,
    filters: payload,
  };
};

export const handleToggleAddForm = (
  state: ServicesState,
  payload: boolean
): ServicesState => {
  return {
    ...state,
    addFormOpen: payload,
  };
};

export const ServicesReducer: Reducer<ServicesState, any> = (
  state: ServicesState = initialState,
  action: Actions
): ServicesState => {
  switch (action.type) {
    case getType(actions.getServicesAction.request):
    case getType(actions.createServicesAction.request):
    case getType(actions.editServicesAction.request):
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case getType(actions.getServicesAction.success):
      return {
        ...state,
        services: action.payload,
        isLoading: false,
        error: null,
      };

    case getType(actions.getServiceByIdAction.success):
      return {
        ...handleGetServiceByIdSuccess(state, action.payload as Service),
        isLoading: false,
        error: null,
      };

    case getType(actions.createServicesAction.success):
    case getType(actions.editServicesAction.success):
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case getType(actions.createServicesAction.failure):
    case getType(actions.editServicesAction.failure):
      return {
        ...state,
        isLoading: false,
        error: (action.payload as any)?.message || "An error occurred",
      };

    case getType(actions.setServiceFilterAction.success):
      return {
        ...handleSetServiceFilters(state, action.payload as ServiceFilterState),
        error: null,
      };

    case getType(toggleAddFormAction):
      return handleToggleAddForm(state, action.payload as boolean);

    case getType(actions.deleteServicesAction.request):
      return { ...state, isDeleting: true, deleteError: null, deleteResponse: null };

    case getType(actions.deleteServicesAction.success):
      return { ...state, isDeleting: false, deleteError: null, deleteResponse: action.payload };

    case getType(actions.deleteServicesAction.failure):
      return { ...state, isDeleting: false, deleteError: (action.payload as any)?.message || "Failed to delete service" };

    default:
      return state;
  }
};
