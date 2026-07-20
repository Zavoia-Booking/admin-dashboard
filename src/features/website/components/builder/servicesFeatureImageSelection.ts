import type {
  GalleryImageRef,
  ServicesConfig,
  WebsiteBuilderLocation,
} from "../../types";
import {
  collectGalleryImages,
  galleryImageRefId,
  isGalleryImageRef,
  type ResolvedGalleryImage,
} from "./gallerySelection";

export type ServicesFeatureImageSelectionMode = "automatic" | "manual" | "stale";

export interface ResolvedServicesFeatureImageSelection {
  image: ResolvedGalleryImage | null;
  mode: ServicesFeatureImageSelectionMode;
}

/**
 * Resolve the Feature image for one location. A valid location-specific override wins; otherwise the
 * location's featured portfolio image (then its first portfolio image) remains the automatic choice.
 */
export function resolveServicesFeatureImageSelection(
  config: ServicesConfig,
  location: WebsiteBuilderLocation,
): ResolvedServicesFeatureImageSelection {
  const availableImages = collectGalleryImages([location]);
  const automaticImage = availableImages[0] ?? null;
  const rawRefs: unknown = config.featureImageRefs;

  if (!Array.isArray(rawRefs)) {
    return {
      image: automaticImage,
      mode: rawRefs === undefined || rawRefs === null ? "automatic" : "stale",
    };
  }

  const rawLocationRefs = rawRefs.filter((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return (value as { locationId?: unknown }).locationId === location.id;
  });
  if (rawLocationRefs.length === 0) return { image: automaticImage, mode: "automatic" };

  for (const rawRef of rawLocationRefs) {
    if (!isGalleryImageRef(rawRef)) continue;
    const manualId = galleryImageRefId(rawRef);
    const manualImage = availableImages.find((image) => image.id === manualId);
    if (manualImage) return { image: manualImage, mode: "manual" };
  }

  return { image: automaticImage, mode: "stale" };
}

/**
 * Canonicalize Services config at the save boundary while preserving forward-compatible unknown keys.
 * Feature overrides are owner-scoped, live portfolio references with at most one image per location.
 */
export function canonicalizeServicesConfigForSave(
  config: Record<string, unknown>,
  locations: WebsiteBuilderLocation[],
): Record<string, unknown> {
  const next = { ...config };
  delete next.descriptionMode;

  if (!Array.isArray(next.featureImageRefs)) {
    delete next.featureImageRefs;
    return next;
  }

  const availableImageIds = new Set(
    collectGalleryImages(locations).map((image) => image.id),
  );
  const seenLocationIds = new Set<number>();
  const refs: GalleryImageRef[] = [];

  for (const rawRef of next.featureImageRefs) {
    if (!isGalleryImageRef(rawRef) || seenLocationIds.has(rawRef.locationId)) continue;
    const ref: GalleryImageRef = {
      locationId: rawRef.locationId,
      imageKey: rawRef.imageKey,
    };
    if (!availableImageIds.has(galleryImageRefId(ref))) continue;
    seenLocationIds.add(ref.locationId);
    refs.push(ref);
  }

  if (refs.length > 0) next.featureImageRefs = refs;
  else delete next.featureImageRefs;

  return next;
}
