import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
    createServicesAction,
    deleteServicesAction,
    editServicesAction,
    getServicesAction, 
    getServiceByIdAction,
    setServiceFilterAction,
    toggleStatusServiceAction
} from "./actions.ts";
import { createServicesRequest, deleteServiceRequest, editServicesRequest, getServicesRequest, getServiceByIdRequest } from "./api.ts";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import type { Service } from "../../shared/types/service.ts";
import type { EditServicePayload, ServiceFilterState } from "./types.ts";
import { getServicesFilterSelector } from "./selectors.ts";
import { mapToGenericFilter } from "./utils.ts";
import { selectCurrentUser } from "../auth/selectors";
import { priceToStorage } from "../../shared/utils/currency";

function* handleGetServices(): Generator<any, void, any> {
    const filters: ServiceFilterState = yield select(getServicesFilterSelector);
    const mappedFilters = mapToGenericFilter(filters);

    try {
        const response: { data: Service[] } = yield call(getServicesRequest, mappedFilters);
        if (response.data) {
            yield put(getServicesAction.success(response.data))
        }
    } catch (error: unknown) {
        console.log(error);
        toast.error('Failed to load services');
    }
}

function* handleGetServiceById(action: ActionType<typeof getServiceByIdAction.request>) {
    try {
        const response: { data: Service } = yield call(getServiceByIdRequest, action.payload);
        if (response.data) {
            yield put(getServiceByIdAction.success(response.data));
        }
    } catch (error: unknown) {
        console.log(error);
        toast.error('Failed to load service details');
    }
}

function* handleCreateServices(action: ActionType<typeof createServicesAction.request>) {
    try {
        const response: { data: { message: string } } = yield call(createServicesRequest, action.payload);
        if (response.data) {
            toast.success('Service created successfully')
            yield put(getServicesAction.request({ reset: true }))
        }
    } catch (error: unknown) {
        console.log(error);
        toast.error('Failed to create service')
    }
}

function* handleDeleteService(action: ActionType<typeof deleteServicesAction.request>) {
    try {
        const response: { data: unknown } = yield call(deleteServiceRequest, action.payload.serviceId);
        if (response.data) {
            toast.success('Service deleted successfully')
            yield put(getServicesAction.request({ reset: true }))
        }
    } catch {
        toast.error('Failed to delete service');
    }
}

function* handleEditServices(action: ActionType<typeof editServicesAction.request>) {

    try {
        const { id, ...editPayload } = action.payload;

        const response: { data: unknown } = yield call(editServicesRequest, id, editPayload);
        if (response.data) {
            toast.success('Service edited successfully')
            yield put(getServicesAction.request({ reset: true }))
        }

    } catch (error: unknown) {
        toast.error('Failed to edit service')
        console.error(error);
    }
}

function* handleToggleStatusService(action: ActionType<typeof toggleStatusServiceAction.request>): Generator<any, void, any> {
    try {
        const { description, duration, id, isActive, name, price } = action.payload;
        
        // Get current user to access business currency
        const currentUser: any = yield select(selectCurrentUser);
        const businessCurrency = currentUser?.business?.businessCurrency || 'eur';
        
        // Convert decimal price from Service object to cents for EditServicePayload
        const price_amount_minor = priceToStorage(price, businessCurrency);
        
        const editPayload: Partial<EditServicePayload> = {
            description,
            duration,
            isActive: !isActive,
            name, 
            price_amount_minor
        }

        const response: { data: unknown } = yield call(editServicesRequest, id, editPayload);

        if (response.data) {
            toast.success('Toggled service status successfully')
            yield put(getServicesAction.request({ reset: true }))
        }
    } catch (error: unknown) {
        toast.error('Failed to toggle service status')
        console.error(error);
    }
}

function* handleSetServiceFilters(action: ActionType<typeof setServiceFilterAction.request>) {
    yield put(setServiceFilterAction.success(action.payload))
    yield put(getServicesAction.request({ reset: true }))
}

export function* servicesSaga(): Generator<unknown, void, unknown> {
    yield all([
        takeLatest(getServicesAction.request, handleGetServices),
        takeLatest(getServiceByIdAction.request, handleGetServiceById),
        takeLatest(createServicesAction.request, handleCreateServices),
        takeLatest(editServicesAction.request, handleEditServices),
        takeLatest(deleteServicesAction.request, handleDeleteService),
        takeLatest(toggleStatusServiceAction.request, handleToggleStatusService),
        takeLatest(setServiceFilterAction.request, handleSetServiceFilters),
    ]);
}
