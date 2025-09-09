import {all, call, put, takeLatest} from "redux-saga/effects";
import {createServicesAction, deleteServicesAction, editServicesAction, getServicesAction} from "./actions.ts";
import {createServicesRequest, deleteServiceRequest, editServicesRequest, getServicesRequest} from "./api.ts";
import type {ActionType} from "typesafe-actions";
import {toast} from "sonner";
import type {Service} from "../../shared/types/service.ts";

function* handleGetServices() {
    try {
        const response: {data: {services: Array<Service>}} =  yield call(getServicesRequest);
        if (response.data) {
            yield put(getServicesAction.success(response.data.services))
        }
    } catch (error: unknown) {
        console.log(error);
    }
}

function* handleCreateServices(action: ActionType<typeof createServicesAction.request>) {
    try {
        const response: {data: unknown} =  yield call(createServicesRequest, action.payload);
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
        const response: {data: unknown} =  yield call(deleteServiceRequest, action.payload.serviceId);
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
        const {id, ...editPayload} = action.payload;

        const response: {data: unknown} =  yield call(editServicesRequest, id, editPayload);
        if (response.data) {
            toast.success('Service edited successfully')
            yield put(getServicesAction.request())
        }

    } catch (error: unknown) {
        toast.success('Filed to edit service')
        console.error(error);
    }
}

export function* servicesSaga(): Generator<unknown, void, unknown> {
    yield all([
        takeLatest(getServicesAction.request, handleGetServices),
        takeLatest(createServicesAction.request, handleCreateServices),
        takeLatest(editServicesAction.request, handleEditServices),
        takeLatest(deleteServicesAction.request, handleDeleteService),
    ]);
}
