import type { ServiceFilterState } from "./types.ts";

/**
 * Longest accepted service name. Mirrors `@MaxLength(64)` on the API's
 * CreateServiceDTO / UpdateServiceDTO — keep the two in step, or the form lets
 * through names the backend rejects with a 400.
 */
export const SERVICE_NAME_MAX_LENGTH = 64;

// Default filters for the services list, including sort configuration.
export const getDefaultServiceFilters = (): ServiceFilterState => {
  return {
    searchTerm: "",
    durationMin: "",
    durationMax: "",
    priceMin: "",
    priceMax: "",
    categoryIds: [],
    // Default sort: newest created first
    sortField: "createdAt",
    sortDirection: "desc",
  };
};


