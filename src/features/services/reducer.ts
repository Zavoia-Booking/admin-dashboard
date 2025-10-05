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
    addFormOpen: false,
    editForm: {
        open: false,
        item: null,
    },
};

const handleGetServiceSuccess = (state: ServicesState, payload: Array<Service>): ServicesState => {
    return {
        ...state,
        services: payload
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
            return handleGetServiceSuccess(state, action.payload);

        case getType(actions.editServicesAction.success):
            return state;
        case getType(actions.setServiceFilterAction.success):
            return handleSetServiceFilters(state, action.payload);
            
        case getType(toggleAddFormAction):
            return handleToggleAddForm(state, action.payload);
        default:
            return state;
    }
}

