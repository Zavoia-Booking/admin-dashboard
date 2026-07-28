import type { ServiceFilterState, ServicesState } from "./types.ts";
import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";
import type { Service } from "../../shared/types/service.ts";
import { getDefaultServiceFilters } from "./utils.ts";
import { toggleAddFormAction } from "./actions";
import i18n from "../../shared/lib/i18n";

type Actions = ActionType<typeof actions> | ActionType<typeof logoutRequestAction>;

const initialState: ServicesState = {
  services: [],
  filters: getDefaultServiceFilters(),
  addFormOpen: false,
  editForm: {
    open: false,
    item: null,
  },
  error: null,
  listError: null,
  isLoading: false,
  isMutating: false,
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
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

    case getType(actions.getServicesAction.request):
      return {
        ...state,
        isLoading: true,
        error: null,
        listError: null,
      };

    case getType(actions.createServicesAction.request):
    case getType(actions.editServicesAction.request):
      return {
        ...state,
        isLoading: true,
        isMutating: true,
        error: null,
      };

    case getType(actions.getServicesAction.success):
      return {
        ...state,
        services: action.payload,
        isLoading: false,
        error: null,
        listError: null,
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
        isMutating: false,
        error: null,
      };

    // Sets only listError: the shared `error` field drives the create/edit
    // sliders' submit handling, which must not react to list-load failures.
    // isLoading likewise stays untouched mid-mutation so the sliders don't
    // read a list failure as their own request completing.
    case getType(actions.getServicesAction.failure):
      return {
        ...state,
        isLoading: state.isMutating ? state.isLoading : false,
        listError: (action.payload as any)?.message || i18n.t("common:errors.generic"),
      };

    case getType(actions.createServicesAction.failure):
    case getType(actions.editServicesAction.failure):
      return {
        ...state,
        isLoading: false,
        isMutating: false,
        error: (action.payload as any)?.message || i18n.t("common:errors.generic"),
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
      return { ...state, isDeleting: false, deleteError: (action.payload as any)?.message || i18n.t("common:errors.failedToDeleteService") };

    default:
      return state;
  }
};
