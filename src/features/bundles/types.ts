// Bundle Price Type enum matching backend
export enum BundlePriceType {
  SUM = "sum",
  FIXED = "fixed",
  DISCOUNT = "discount",
}

export interface BundleService {
  id: number;
  uuid: string;
  name: string;
  price_amount_minor: number;
  duration: number;
}

export interface Bundle {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  priceType: BundlePriceType;
  fixedPriceAmountMinor?: number;
  discountPercentage?: number;
  calculatedPriceAmountMinor: number;
  serviceIds: number[];
  services: BundleService[];
  createdAt: string;
  updatedAt: string;
}

export type BundlesState = {
  bundles: Bundle[];
  error: string | null;
  isLoading: boolean;
};

export type CreateBundlePayload = {
  name: string;
  description?: string;
  priceType: BundlePriceType;
  fixedPriceAmountMinor?: number; // Price in integer cents (only for FIXED type)
  discountPercentage?: number; // Percentage 0-100 (only for DISCOUNT type)
  serviceIds: number[];
};

export type UpdateBundlePayload = {
  id: number;
  name: string;
  description?: string;
  priceType: BundlePriceType;
  fixedPriceAmountMinor?: number; // Price in integer cents (only for FIXED type)
  discountPercentage?: number; // Percentage 0-100 (only for DISCOUNT type)
  serviceIds: number[];
};

// Sorting types for bundles
export type BundleSortField = "price" | "serviceCount" | "createdAt" | "updatedAt";

export type BundleSortDirection = "asc" | "desc";

// Filter state for bundles
export type BundleFilterState = {
  searchTerm: string;
  priceMin: string;
  priceMax: string;
  serviceCountMin: string;
  serviceCountMax: string;
  priceTypes: BundlePriceType[];
  sortField: BundleSortField;
  sortDirection: BundleSortDirection;
};

// Default filter state factory
export const getDefaultBundleFilters = (): BundleFilterState => ({
  searchTerm: "",
  priceMin: "",
  priceMax: "",
  serviceCountMin: "",
  serviceCountMax: "",
  priceTypes: [],
  sortField: "createdAt",
  sortDirection: "desc",
});

