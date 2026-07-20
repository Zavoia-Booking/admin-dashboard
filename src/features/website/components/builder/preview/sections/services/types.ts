import type { WebsiteBuilderLocation } from "../../../../../types";
import type { T } from "../../shared/types";

export type ServiceMenuItem = {
  key: string;
  sourceId: number;
  name: string;
  description: string;
  duration: number;
  priceMinor: number;
  isBundle: boolean;
  includes: string[];
};

export type ServiceMenuGroup = {
  key: string;
  name: string;
  items: ServiceMenuItem[];
};

export type MoneyDisplay = {
  full: string;
  value: string;
  symbol: string;
};

/** Shared data contract for the three Services layouts. The orchestrator owns the selected location,
 *  canonical service grouping, currency formatting and empty state; each variant owns its markup/motion. */
export type ServicesVariantProps = {
  location: WebsiteBuilderLocation;
  groups: ServiceMenuGroup[];
  currency: string;
  locale: "en" | "ro";
  featureImageUrl: string | null;
  showDescriptions: boolean;
  showDurations: boolean;
  t: T;
};

export type ServicesPage = {
  key: string;
  category: string;
  items: ServiceMenuItem[];
  categoryPage: number;
  categoryPages: number;
  categoryTotal: number;
  categoryMin: number;
};

export type ServicesCard = {
  key: string;
  category: string;
  items: ServiceMenuItem[];
  categoryPart: number;
  categoryParts: number;
  categoryTotal: number;
  categoryMin: number;
};
