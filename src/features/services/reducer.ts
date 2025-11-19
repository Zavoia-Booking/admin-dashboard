import type { ServiceFilterState, ServicesState } from "./types.ts";
import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { Reducer } from "redux";
import type { Service } from "../../shared/types/service.ts";
import { getDefaultServiceFilters } from "./utils.ts";
import { toggleAddFormAction } from "./actions";

type Actions = ActionType<typeof actions>

const initialState: ServicesState = {
    services: [],
    filters: getDefaultServiceFilters(),
    pagination: {
        offset: 0,
        limit: 20,
        total: 0,
        hasMore: false,
    },
    addFormOpen: false,
    editForm: {
        open: false,
        item: null,
    },
};

const handleGetServiceSuccess = (state: ServicesState, payload: { services: Service[]; pagination: { offset: number; limit: number; total: number; hasMore: boolean } }, reset: boolean): ServicesState => {
    return {
        ...state,
        services: reset ? payload.services : [...state.services, ...payload.services],
        pagination: payload.pagination
    }
}

const handleGetServiceByIdSuccess = (state: ServicesState, payload: Service): ServicesState => {
    // Update the service in the list if it exists, otherwise add it
    const existingIndex = state.services.findIndex(s => s.id === payload.id);
    const updatedServices = existingIndex >= 0
        ? state.services.map((s, idx) => idx === existingIndex ? payload : s)
        : [...state.services, payload];
    
    return {
        ...state,
        services: updatedServices,
        editForm: {
            ...state.editForm,
            item: payload
        }
    }
}

export const handleSetServiceFilters = (state: ServicesState, payload: ServiceFilterState):ServicesState => {
    return {
        ...state,
        filters: payload
    }
}

export const handleToggleAddForm = (state: ServicesState, payload: boolean):ServicesState => {
    return {
        ...state,
        addFormOpen: payload
    }
}

export const ServicesReducer: Reducer<ServicesState, any> = (state: ServicesState = initialState, action: Actions) => {
    switch (action.type) {
        case getType(actions.getServicesAction.success):
            // Check if this is a reset (first page) by comparing offset
            const reset = action.payload.pagination.offset === 0;
            return handleGetServiceSuccess(state, action.payload, reset);

        case getType(actions.getServiceByIdAction.success):
            return handleGetServiceByIdSuccess(state, action.payload);

        case getType(actions.editServicesAction.success):
            return state;
        case getType(actions.setServiceFilterAction.success):
            return {
                ...handleSetServiceFilters(state, action.payload),
                services: [], // Reset services when filters change
                pagination: initialState.pagination
            };
            
        case getType(toggleAddFormAction):
            return handleToggleAddForm(state, action.payload);
        default:
            return state;
    }
}

