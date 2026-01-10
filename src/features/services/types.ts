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
  isDeleting: boolean;
  deleteError: string | null;
  deleteResponse?: any | null;
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

export type ServiceSortField = "price" | "duration" | "createdAt" | "updatedAt";

export type ServiceSortDirection = "asc" | "desc";

export type ServiceFilterState = {
  searchTerm: string;
  priceMin: string;
  priceMax: string;
  durationMin: string;
  durationMax: string;
  /**
   * Selected category filters. Empty array = no category filter.
   * This is independent from the single category used in add/edit forms.
   */
  categoryIds: number[];
  sortField: ServiceSortField;
  sortDirection: ServiceSortDirection;
};
