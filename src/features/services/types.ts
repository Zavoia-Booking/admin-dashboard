import type { Service } from "../../shared/types/service.ts";

export type ServicesState = {
  services: Service[];
  filters: ServiceFilterState;
  addFormOpen: boolean;
  editForm: {
    open: boolean;
    item: null | Service;
  };
  error: string | null;
  isLoading: boolean;
};

export type CreateServicePayload = {
  name: string;
  price_amount_minor: number; // Price in integer cents
  duration: number;
  description: string;
  locations?: number[];
  teamMembers?: number[];
  category?: {
    categoryId?: number;
    categoryName?: string;
    categoryColor?: string;
  };
  additionalCategories?: Array<{
    name: string;
    color: string;
  }>;
};

export type EditServicePayload = {
  name: string;
  description: string;
  duration: number;
  price_amount_minor: number; // Price in integer cents
  id: number;
  locations?: number[];
  teamMembers?: number[];
  category?: {
    categoryId?: number;
    categoryName?: string;
    categoryColor?: string;
  };
  additionalCategories?: Array<{
    name: string;
    color: string;
  }>;
};

export type ServiceFilterState = {
  searchTerm: string;
  status: string;
  priceMin: string;
  priceMax: string;
  durationMin: string;
  durationMax: string;
};
