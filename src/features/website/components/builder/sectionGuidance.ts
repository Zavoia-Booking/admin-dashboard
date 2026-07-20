import type {
  LocationsConfig,
  SectionEntry,
  ServicesConfig,
  WebsiteBuilderLocation,
} from "../../types";
import { resolveVisibleLocations } from "./locationSelection";
import { locationPhoto } from "./preview/shared/contact";
import { isWebsiteSectionLinkType } from "./preview/shared/sectionLinks";

export type WebsiteSectionGuidance =
  | { kind: "nav-empty-links" }
  | { kind: "services-no-locations" }
  | { kind: "services-no-visible-locations" }
  | { kind: "services-empty"; locationId: number }
  | {
      kind: "services-location-empty";
      locationId: number;
      locationName: string;
      current: number;
      required: number;
    }
  | { kind: "locations-none" }
  | {
      kind: "locations-photos";
      current: number;
      required: number;
      missingLocationId: number;
      missingLocationName: string;
      missingCount: number;
    }
  | { kind: "reviews-no-quotes" }
  | { kind: "footer-no-locations" }
  | { kind: "footer-no-contact" };

interface WebsiteSectionGuidanceInput {
  entry: SectionEntry;
  previewVariant: string;
  layout: readonly SectionEntry[];
  locations: WebsiteBuilderLocation[];
  serviceLocations: WebsiteBuilderLocation[];
  selectedLocationId?: number | null;
  totalReviewCount: number;
  eligibleQuoteCount: number;
  hasFooterContact: boolean;
}

const FOOTER_LOCATION_VARIANTS = new Set(["directory", "signature", "masthead"]);
const FOOTER_CONTACT_VARIANTS = new Set(["directory", "signature", "masthead"]);
const QUOTE_LED_REVIEW_VARIANTS = new Set(["wall", "marquee", "spotlight", "deck"]);

function locationHasServiceContent(
  location: WebsiteBuilderLocation,
  includeBundles: boolean,
): boolean {
  return (location.services?.length ?? 0) > 0 ||
    (includeBundles && (location.bundles?.length ?? 0) > 0);
}

/**
 * Returns at most one actionable, non-blocking guidance state for the open section. Hard publish
 * readiness remains in sectionReadiness.ts; this resolver is for setup, style-fit and source-data gaps.
 */
export function getWebsiteSectionGuidance({
  entry,
  previewVariant,
  layout,
  locations,
  serviceLocations,
  selectedLocationId,
  totalReviewCount,
  eligibleQuoteCount,
  hasFooterContact,
}: WebsiteSectionGuidanceInput): WebsiteSectionGuidance | null {
  if (entry.type === "nav") {
    const linkCount = layout.filter(
      (section) => section.visible && isWebsiteSectionLinkType(section.type),
    ).length;
    return linkCount === 0 ? { kind: "nav-empty-links" } : null;
  }

  if (entry.type === "services") {
    if (locations.length === 0) return { kind: "services-no-locations" };
    if (serviceLocations.length === 0) return { kind: "services-no-visible-locations" };

    const config = (entry.config ?? {}) as ServicesConfig;
    const includeBundles = config.hideBundles !== true;
    const readyLocations = serviceLocations.filter((location) =>
      locationHasServiceContent(location, includeBundles),
    );
    if (readyLocations.length === 0) {
      return { kind: "services-empty", locationId: serviceLocations[0].id };
    }

    const selectedLocation = serviceLocations.find(
      (location) => location.id === selectedLocationId,
    ) ?? serviceLocations[0];
    if (!locationHasServiceContent(selectedLocation, includeBundles)) {
      return {
        kind: "services-location-empty",
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
        current: readyLocations.length,
        required: serviceLocations.length,
      };
    }
    return null;
  }

  if (entry.type === "locations") {
    if (locations.length === 0) return { kind: "locations-none" };
    if (!entry.visible) return null;

    const visibleLocations = resolveVisibleLocations(
      (entry.config ?? {}) as LocationsConfig,
      locations,
    );
    const withPhotos = visibleLocations.filter((location) => !!locationPhoto(location));
    const missing = visibleLocations.filter((location) => !locationPhoto(location));
    if (missing.length > 0) {
      return {
        kind: "locations-photos",
        current: withPhotos.length,
        required: visibleLocations.length,
        missingLocationId: missing[0].id,
        missingLocationName: missing[0].name,
        missingCount: missing.length,
      };
    }
    return null;
  }

  if (
    entry.type === "testimonials" &&
    entry.visible &&
    totalReviewCount > 0 &&
    eligibleQuoteCount === 0 &&
    QUOTE_LED_REVIEW_VARIANTS.has(previewVariant)
  ) {
    return { kind: "reviews-no-quotes" };
  }

  if (entry.type === "footer") {
    if (FOOTER_LOCATION_VARIANTS.has(previewVariant) && locations.length === 0) {
      return { kind: "footer-no-locations" };
    }
    if (FOOTER_CONTACT_VARIANTS.has(previewVariant) && !hasFooterContact) {
      return { kind: "footer-no-contact" };
    }
  }

  return null;
}
