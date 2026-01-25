// Location assigned to the team member
export interface AssignedLocation {
  id: number;
  name: string;
  address: string | null;
}

// Service assigned at a location
export interface AssignedService {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
    color?: string;
  } | null;
  // Current effective values (after any overrides)
  price: number; // cents
  displayPrice: number; // decimal
  duration: number; // minutes
  // Whether the team member has custom overrides
  hasCustomOverride: boolean;
  // Default values (only present when hasCustomOverride is true)
  defaultDisplayPrice?: number; // decimal
  defaultDuration?: number; // minutes
}

// Bundle assigned at a location
export interface AssignedBundle {
  bundleId: number;
  bundleName: string;
  priceType: 'sum' | 'fixed' | 'discount';
  fixedPriceAmountMinor: number | null;
  discountPercentage: number | null;
  calculatedPriceAmountMinor: number; // cents
  calculatedDisplayPrice: number; // decimal
  serviceCount: number;
  serviceIds: number[];
}

// Full location assignments response
export interface LocationAssignments {
  location: {
    id: number;
    name: string;
    address: string | null;
  };
  services: AssignedService[];
  bundles: AssignedBundle[];
}
