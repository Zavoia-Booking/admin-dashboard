import type { Service } from "../../shared/types/service.ts";

export type ServicesState = {
  services: Service[];
};

export type CreateServicePayload = {
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
  locationIds: number[],
}

export type EditServicePayload = {
  name: string,
  description: string,
  duration: number
  price: number;
  locationIds: number[],
  id: number,
  isActive: boolean,
}