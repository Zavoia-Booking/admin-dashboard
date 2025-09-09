import type { ServicesState } from "./types.ts";
import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { Reducer } from "redux";
import type { Service } from "../../shared/types/service.ts";

type Actions = ActionType<typeof actions>

const initialState: ServicesState = {
    services: [],
};

const handleGetServiceSuccess = (state: ServicesState, payload: Array<Service>): ServicesState => {
    return {
        ...state,
        services: payload
    }
}

export const ServicesReducer: Reducer<ServicesState, any> = (state: ServicesState = initialState, action: Actions) => {
    switch (action.type) {
        case getType(actions.getServicesAction.success):
            return handleGetServiceSuccess(state, action.payload);

        case getType(actions.editServicesAction.success):
            return state;

        default:
            return state;
    }
}

