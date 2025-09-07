import {createAsyncAction} from "typesafe-actions";
import type {CreateServicePayload, EditServicePayload} from "./types.ts";
import type {Service} from "../../shared/types/service.ts";

export const getServicesAction= createAsyncAction(
    "GET/SERVICES/REQUEST",
    "GET/SERVICES/SUCCESS",
    "GET/SERVICES/FAILURE"
)<void, Array<Service>, unknown>();

export const createServicesAction = createAsyncAction(
    "CREATE/SERVICES/REQUEST",
    "CREATE/SERVICES/SUCCESS",
    "CREATE/SERVICES/FAILURE"
)<CreateServicePayload, unknown, unknown>();

export const editServicesAction = createAsyncAction(
    "EDIT/SERVICES/REQUEST",
    "EDIT/SERVICES/SUCCESS",
    "EDIT/SERVICES/FAILURE"
)<EditServicePayload, unknown, unknown>();;

export const deleteServicesAction = createAsyncAction(
    "DELETE/SERVICES/REQUEST",
    "DELETE/SERVICES/SUCCESS",
    "DELETE/SERVICES/FAILURE"
)<{serviceId: number| string}, unknown, unknown>();
