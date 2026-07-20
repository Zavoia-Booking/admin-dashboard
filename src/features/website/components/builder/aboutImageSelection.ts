import type {
  AboutConfig,
  GalleryImageRef,
  WebsiteBuilderLocation,
} from "../../types";
import {
  collectGalleryImages,
  galleryImageRefId,
  isGalleryImageRef,
  type ResolvedGalleryImage,
} from "./gallerySelection";

export type AboutImageSelectionMode = "automatic" | "manual" | "stale";

export interface ResolvedAboutImageSelection {
  /** The photo rendered now. A stale manual reference safely falls back to the recommended photo. */
  image: ResolvedGalleryImage | null;
  mode: AboutImageSelectionMode;
}

function recommendedFromImages(images: ResolvedGalleryImage[]): ResolvedGalleryImage | null {
  return images.find((image) => image.featured) ?? images[0] ?? null;
}

/**
 * Pick the first featured portfolio photo across all owned locations in their stable API order.
 * Only when no location has a featured photo do we fall back to the first valid portfolio image.
 */
export function recommendedAboutImage(
  locations: WebsiteBuilderLocation[],
): ResolvedGalleryImage | null {
  return recommendedFromImages(collectGalleryImages(locations));
}

/**
 * Resolve the optional manual reference against the canonical location portfolios. Missing means
 * automatic; a removed or malformed manual reference is reported as stale and renders automatic.
 */
export function resolveAboutImageSelection(
  config: AboutConfig,
  locations: WebsiteBuilderLocation[],
): ResolvedAboutImageSelection {
  const availableImages = collectGalleryImages(locations);
  const automaticImage = recommendedFromImages(availableImages);
  const rawRef: unknown = config.imageRef;
  // State patches clear a config key with `undefined`; JSON reads may also contain legacy null.
  // Both are the documented automatic state even if the in-memory object still owns the key.
  const hasStoredRef = rawRef !== undefined && rawRef !== null;

  if (!hasStoredRef) {
    return { image: automaticImage, mode: "automatic" };
  }

  if (isGalleryImageRef(rawRef)) {
    const manualId = galleryImageRefId(rawRef);
    const manualImage = availableImages.find((image) => image.id === manualId);
    if (manualImage) {
      return { image: manualImage, mode: "manual" };
    }
  }

  return { image: automaticImage, mode: "stale" };
}

/** Compact renderer helper for About variants that include photography. */
export function resolveAboutImage(
  config: AboutConfig,
  locations: WebsiteBuilderLocation[],
): ResolvedGalleryImage | null {
  return resolveAboutImageSelection(config, locations).image;
}

/**
 * Canonicalize known About config at the save boundary. Unknown keys remain untouched. A stale or
 * malformed image reference becomes the documented missing-field automatic state.
 */
export function canonicalizeAboutConfigForSave(
  config: Record<string, unknown>,
  locations: WebsiteBuilderLocation[],
): Record<string, unknown> {
  const next = { ...config };
  const rawRef = next.imageRef;

  if ("showStats" in next && typeof next.showStats !== "boolean") {
    delete next.showStats;
  }

  if (!isGalleryImageRef(rawRef)) {
    delete next.imageRef;
    return next;
  }

  const availableIds = new Set(collectGalleryImages(locations).map((image) => image.id));
  const ref: GalleryImageRef = {
    locationId: rawRef.locationId,
    imageKey: rawRef.imageKey,
  };

  if (availableIds.has(galleryImageRefId(ref))) next.imageRef = ref;
  else delete next.imageRef;

  return next;
}
