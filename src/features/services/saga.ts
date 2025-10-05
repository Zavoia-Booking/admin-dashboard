import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
    createServicesAction,
    deleteServicesAction,
    editServicesAction,
    getServicesAction, setServiceFilterAction,
    toggleStatusServiceAction
} from "./actions.ts";
import { createServicesRequest, deleteServiceRequest, editServicesRequest, getServicesRequest } from "./api.ts";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import type { Service } from "../../shared/types/service.ts";
import type { EditServicePayload, ServiceFilterState } from "./types.ts";
import { getServicesFilterSelector } from "./selectors.ts";
import { mapToGenericFilter } from "./utils.ts";

function* handleGetServices() {
    
    const filters: ServiceFilterState = yield select(getServicesFilterSelector);

    const mappedFilters = mapToGenericFilter(filters);

    try {
        const response: { data: { services: Service[] } } = yield call(getServicesRequest, mappedFilters);
        if (response.data) {
            yield put(getServicesAction.success(response.data.services))
        }
    } catch (error: unknown) {
        console.log(error);
    }
}

function* handleCreateServices(action: ActionType<typeof createServicesAction.request>) {
    try {
        const response: { data: { message: string } } = yield call(createServicesRequest, action.payload);
        if (response.data) {
            toast.success('Service created successfully')
            yield put(getServicesAction.request())
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
            yield put(getServicesAction.request())
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
            yield put(getServicesAction.request())
        }

    } catch (error: unknown) {
        toast.success('Filed to edit service')
        console.error(error);
    }
}

function* handleToggleStatusService(action: ActionType<typeof toggleStatusServiceAction.request>) {
    const { description, duration, id, isActive, name, price } = action.payload;
    
    const editPayload: Partial<EditServicePayload> = {
        description,
        duration,
        isActive: !isActive,
        name, 
        price
    }

    const response: { data: unknown } = yield call(editServicesRequest, id, editPayload);

    if (response.data) {
        toast.success('Toggled service status successfully')
        yield put(getServicesAction.request())
    }
}

function* handleSetServiceFilters(action: ActionType<typeof setServiceFilterAction.request>) {
    yield put(setServiceFilterAction.success(action.payload))
    yield put(getServicesAction.request())
}

export function* servicesSaga(): Generator<unknown, void, unknown> {
    yield all([
        takeLatest(getServicesAction.request, handleGetServices),
        takeLatest(createServicesAction.request, handleCreateServices),
        takeLatest(editServicesAction.request, handleEditServices),
        takeLatest(deleteServicesAction.request, handleDeleteService),
        takeLatest(toggleStatusServiceAction.request, handleToggleStatusService),
        takeLatest(setServiceFilterAction.request, handleSetServiceFilters),
    ]);
}
