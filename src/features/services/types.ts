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
  price_amount_minor: number; // Price in integer cents
  duration: number;
  description: string;
  isActive: boolean;
  locations?: number[];
  teamMembers?: number[];
  category?: {
    categoryId?: number;
    categoryName?: string;
    categoryColor?: string;
  };
}

export type EditServicePayload = {
  name: string,
  description: string,
  duration: number
  price_amount_minor: number; // Price in integer cents
  id: number,
  isActive: boolean,
  locations?: number[];
  teamMembers?: number[];
  categoryId?: number | null;
}

export type ServiceFilterState = {
  searchTerm: string,
  status: string,
  priceMin: string,
  priceMax: string,
  durationMin: string,
  durationMax: string
}