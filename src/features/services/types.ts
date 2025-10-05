import type { Service } from "../../shared/types/service.ts";

export type ServicesState = {
  services: Service[];
  filters: ServiceFilterState;
  addFormOpen: boolean,
  editForm: {
    open: boolean,
    item: null | Service,
  },
};

export type CreateServicePayload = {
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
}

export type EditServicePayload = {
  name: string,
  description: string,
  duration: number
  price: number;
  id: number,
  isActive: boolean,
}

export type ServiceFilterState = {
  searchTerm: string,
  status: string,
  priceMin: string,
  priceMax: string,
  durationMin: string,
  durationMax: string
}