import type {
  GalleryConfig,
  GalleryImageRef,
  WebsiteBuilderLocation,
} from "../../types";

export const MIN_GALLERY_IMAGES = 4;
export const DEFAULT_GALLERY_IMAGES = 8;
export const MAX_GALLERY_IMAGES = 16;

export interface ResolvedGalleryImage {
  id: string;
  ref: GalleryImageRef;
  src: string;
  alt: string;
  locationName: string;
  featured: boolean;
}

export const galleryImageRefId = ({ locationId, imageKey }: GalleryImageRef) =>
  JSON.stringify([locationId, imageKey]);

export function isGalleryImageRef(value: unknown): value is GalleryImageRef {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const ref = value as Partial<GalleryImageRef>;
  return Number.isInteger(ref.locationId) && (ref.locationId ?? 0) > 0 &&
    typeof ref.imageKey === "string" && ref.imageKey.trim().length > 0;
}

function includedLocationSet(config: Pick<GalleryConfig, "includedLocationIds">) {
  return Array.isArray(config.includedLocationIds)
    ? new Set(config.includedLocationIds.filter((id) => Number.isInteger(id) && id > 0))
    : null;
}

function imagesForLocation(location: WebsiteBuilderLocation): ResolvedGalleryImage[] {
  const images = (location.portfolioImages ?? [])
    .filter((image) => typeof image.key === "string" && image.key.trim() && image.url)
    .map((image) => ({
      id: galleryImageRefId({ locationId: location.id, imageKey: image.key }),
      ref: { locationId: location.id, imageKey: image.key },
      src: image.url,
      alt: image.originalName ?? "",
      locationName: location.name,
      featured: image.url === location.featuredImage,
    }));

  const featuredIndex = images.findIndex((image) => image.featured);
  if (featuredIndex <= 0) return images;
  return [images[featuredIndex], ...images.slice(0, featuredIndex), ...images.slice(featuredIndex + 1)];
}

/** Every selectable image, grouped in the API's stable location order and featured-first within a location. */
export function collectGalleryImages(
  locations: WebsiteBuilderLocation[],
  config: Pick<GalleryConfig, "includedLocationIds"> = {},
): ResolvedGalleryImage[] {
  const included = includedLocationSet(config);
  return locations
    .filter((location) => included === null || included.has(location.id))
    .flatMap(imagesForLocation);
}

/**
 * Balanced deterministic starter selection: one image per location per pass, featured first,
 * then the remaining upload order. Exact repeated refs/URLs are emitted once.
 */
export function autoFillGalleryImageRefs(
  locations: WebsiteBuilderLocation[],
  config: Pick<GalleryConfig, "includedLocationIds"> = {},
  limit = DEFAULT_GALLERY_IMAGES,
): GalleryImageRef[] {
  const included = includedLocationSet(config);
  const groups = locations
    .filter((location) => included === null || included.has(location.id))
    .map(imagesForLocation)
    .filter((images) => images.length > 0);
  const refs: GalleryImageRef[] = [];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const cap = Math.min(Math.max(0, limit), MAX_GALLERY_IMAGES);

  for (let imageIndex = 0; refs.length < cap; imageIndex += 1) {
    let found = false;
    for (const group of groups) {
      const image = group[imageIndex];
      if (!image) continue;
      found = true;
      if (seenIds.has(image.id) || seenUrls.has(image.src)) continue;
      seenIds.add(image.id);
      seenUrls.add(image.src);
      refs.push(image.ref);
      if (refs.length === cap) break;
    }
    if (!found) break;
  }

  return refs;
}

/** Resolve the persisted order against current portfolio data; missing/deleted refs are skipped safely. */
export function resolveGalleryImages(
  config: GalleryConfig,
  locations: WebsiteBuilderLocation[],
): ResolvedGalleryImage[] {
  const available = collectGalleryImages(locations, config);
  const byId = new Map(available.map((image) => [image.id, image]));
  const refs = Array.isArray(config.imageRefs)
    ? config.imageRefs.filter(isGalleryImageRef)
    : autoFillGalleryImageRefs(locations, config);
  const resolved: ResolvedGalleryImage[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    const id = galleryImageRefId(ref);
    const image = byId.get(id);
    if (!image || seen.has(id)) continue;
    seen.add(id);
    resolved.push(image);
    if (resolved.length === MAX_GALLERY_IMAGES) break;
  }

  return resolved;
}

export function isGallerySelectionIncomplete(
  config: GalleryConfig,
  locations: WebsiteBuilderLocation[],
): boolean {
  return resolveGalleryImages(config, locations).length < MIN_GALLERY_IMAGES;
}

/** Materialize the legacy auto-fill state before the first explicit selection/order edit. */
export function currentGalleryImageRefs(
  config: GalleryConfig,
  locations: WebsiteBuilderLocation[],
): GalleryImageRef[] {
  return Array.isArray(config.imageRefs)
    ? config.imageRefs.filter(isGalleryImageRef).slice(0, MAX_GALLERY_IMAGES)
    : autoFillGalleryImageRefs(locations, config);
}

/**
 * Canonicalize known Gallery config at the API boundary. This keeps tolerant legacy reads
 * from turning into failed unrelated saves after a location/image was removed, while keeping
 * the product distinction between a missing field (automatic/all) and an empty array (none).
 */
export function canonicalizeGalleryConfigForSave(
  config: Record<string, unknown>,
  locations: WebsiteBuilderLocation[],
): Record<string, unknown> {
  const next = { ...config };
  const ownedLocationIds = new Set(locations.map((location) => location.id));

  if (Array.isArray(next.includedLocationIds)) {
    next.includedLocationIds = [
      ...new Set(
        next.includedLocationIds.filter(
          (id): id is number => Number.isInteger(id) && id > 0 && ownedLocationIds.has(id),
        ),
      ),
    ];
  } else {
    // null and malformed legacy values render like a missing field: every owned location.
    delete next.includedLocationIds;
  }

  if (Array.isArray(next.imageRefs)) {
    const includedLocationIds = Array.isArray(next.includedLocationIds)
      ? (next.includedLocationIds as number[])
      : undefined;
    const availableIds = new Set(
      collectGalleryImages(locations, { includedLocationIds }).map((image) => image.id),
    );
    const refs: GalleryImageRef[] = [];
    const seen = new Set<string>();

    for (const rawRef of next.imageRefs) {
      if (!isGalleryImageRef(rawRef)) continue;
      const ref = { locationId: rawRef.locationId, imageKey: rawRef.imageKey };
      const id = galleryImageRefId(ref);
      if (!availableIds.has(id) || seen.has(id)) continue;
      seen.add(id);
      refs.push(ref);
      if (refs.length === MAX_GALLERY_IMAGES) break;
    }
    next.imageRefs = refs;
  } else {
    // null and malformed legacy values render like a missing field: deterministic auto-fill.
    delete next.imageRefs;
  }

  return next;
}
