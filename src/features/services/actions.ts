import { createAction, createAsyncAction } from "typesafe-actions";
import type { CreateServicePayload, EditServicePayload, ServiceFilterState } from "./types.ts";
import type { Service } from "../../shared/types/service.ts";

export const getServicesAction = createAsyncAction(
    "GET/SERVICES/REQUEST",
    "GET/SERVICES/SUCCESS",
    "GET/SERVICES/FAILURE"
)<void, Service[], unknown>();

export const createServicesAction = createAsyncAction(
    "CREATE/SERVICES/REQUEST",
    "CREATE/SERVICES/SUCCESS",
    "CREATE/SERVICES/FAILURE"
)<CreateServicePayload, unknown, unknown>();

export const editServicesAction = createAsyncAction(
    "EDIT/SERVICES/REQUEST",
    "EDIT/SERVICES/SUCCESS",
    "EDIT/SERVICES/FAILURE"
)<EditServicePayload, unknown, unknown>();

export const deleteServicesAction = createAsyncAction(
    "DELETE/SERVICES/REQUEST",
    "DELETE/SERVICES/SUCCESS",
    "DELETE/SERVICES/FAILURE"
)<{ serviceId: number }, unknown, unknown>();

export const toggleStatusServiceAction = createAsyncAction(
    "TOGGLE/STATUS/SERVICES/REQUEST",
    "TOGGLE/STATUS/SERVICES/SUCCESS",
    "TOGGLE/STATUS/SERVICES/FAILURE"
)<Service, unknown, unknown>();

export const setServiceFilterAction = createAsyncAction(
    'SERVICE/FILTER/SET/REQUEST',
    'SERVICE/FILTER/SET/SUCCESS',
    'SERVICE/FILTER/SET/FAILURE',
)<ServiceFilterState, ServiceFilterState, void>()

export const toggleAddFormAction = createAction('SERVICE/CREATE/TOGGLE')<boolean>()

export const toggleEditFormAction = createAction('SERVICE/EDIT/TOGGLE')<{
    open: boolean,
    item: Service | null,
}>()