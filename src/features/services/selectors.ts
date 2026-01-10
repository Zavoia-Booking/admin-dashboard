import { createSelector } from "@reduxjs/toolkit";
import { getServicesStateSelector } from "../../app/providers/selectors.ts";
import { getDefaultServiceFilters } from "./utils";
import type { ServiceFilterState } from "./types.ts";
import type { Service } from "../../shared/types/service.ts";

export const getServicesListSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return Array.isArray(state.services) ? state.services : [];
  }
);

export const getServicesFilterSelector = createSelector(
  getServicesStateSelector,
  (state): ServiceFilterState => {
    // Normalize filters with defaults so newly added fields always have
    // a defined value (local-only state, no persistence yet).
    return {
      ...getDefaultServiceFilters(),
      ...(state.filters || {}),
    };
  }
);

export const getFilteredServicesListSelector = createSelector(
  [getServicesListSelector, getServicesFilterSelector],
  (services: Service[], filters: ServiceFilterState): Service[] => {
    const {
      searchTerm,
      priceMin,
      priceMax,
      durationMin,
      durationMax,
      categoryIds,
      sortField,
      sortDirection,
    } = filters;

    const query = searchTerm.trim().toLowerCase();
    // Treat empty string and "0" as "no price filter" to avoid applying
    // an unintended "0" boundary when the user hasn't actually set a price.
    const minPrice =
      priceMin !== "" && priceMin !== "0" ? Number(priceMin) : null;
    const maxPrice =
      priceMax !== "" && priceMax !== "0" ? Number(priceMax) : null;
    const minDuration = durationMin ? Number(durationMin) : null;
    const maxDuration = durationMax ? Number(durationMax) : null;

    const tokens = query
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const filtered = services.filter((service) => {
      // Search across name and category (the only fields visible in the card)
      if (tokens.length > 0) {
        const namePart = service.name ?? "";
        const categoryPart = service.category?.name ?? "";

        const haystack = `${namePart} ${categoryPart}`.toLowerCase();

        const matchesAllTokens = tokens.every((token) =>
          haystack.includes(token)
        );
        if (!matchesAllTokens) {
          return false;
        }
      }

      if (minPrice !== null && service.price < minPrice) {
        return false;
      }

      if (maxPrice !== null && service.price > maxPrice) {
        return false;
      }

      if (minDuration !== null && service.duration < minDuration) {
        return false;
      }

      if (maxDuration !== null && service.duration > maxDuration) {
        return false;
      }

      // Filter by categories (if one or more are selected)
      if (
        Array.isArray(categoryIds) &&
        categoryIds.length > 0
      ) {
        const serviceCategoryId = service.category?.id ?? null;
        if (serviceCategoryId === null || !categoryIds.includes(serviceCategoryId)) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting after filtering based on the configured sort field/direction
    const sorted = [...filtered].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case "price":
          aVal = a.price ?? 0;
          bVal = b.price ?? 0;
          break;
        case "duration":
          aVal = a.duration ?? 0;
          bVal = b.duration ?? 0;
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal === bVal) return 0;
      const diff = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? diff : -diff;
    });

    return sorted;
  }
);

export const getAddFormSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.addFormOpen;
  }
);
export const getEditFormSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.editForm;
  }
);

export const getServicesErrorSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.error;
  }
);

export const getServicesLoadingSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.isLoading;
  }
);

export const getServicesDeletingSelector = createSelector(
  getServicesStateSelector,
  (state): boolean => {
    return state.isDeleting ?? false;
  }
);

export const getServicesDeleteResponseSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.deleteResponse;
  }
);

export const getServicesDeleteErrorSelector = createSelector(
  getServicesStateSelector,
  (state): string | null => {
    return state.deleteError ?? null;
  }
);
