import type {Service, StaffAssignment} from "../../shared/types/service.ts";

export type ServicesState = {
    services: Array<Service>;
};

export type CreateServicePayload = {
    name: string;
    price: number;
    duration: number;
    description: string;
    staff?: StaffAssignment[],
    teamMembers: Array<unknown>,
    locationIds: Array<number>,
}
export type EditServicePayload = {
    name: string,
    description: string,
    duration: number
    price: number;
    teamMembers: Array<unknown>,
    locationIds: Array<unknown>,
    id: string,
}