import type { ServiceFilterState } from "./types.ts";

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


