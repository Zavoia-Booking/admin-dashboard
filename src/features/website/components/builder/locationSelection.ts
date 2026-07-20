import type {
  LocationsConfig,
  PageLayout,
  WebsiteBuilderLocation,
} from "../../types";

function validLocationIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is number => Number.isInteger(id) && id > 0,
  );
}

/**
 * Resolve an optional saved order against the owner's current locations. Stale and duplicate IDs are
 * ignored; newly-created locations append in the API's stable order. A missing/empty preference preserves
 * that API order exactly.
 */
export function resolveOrderedLocations(
  config: Pick<LocationsConfig, "orderedLocationIds">,
  locations: WebsiteBuilderLocation[],
): WebsiteBuilderLocation[] {
  const preferredIds = validLocationIds(config.orderedLocationIds);
  if (preferredIds.length === 0) return locations;

  const byId = new Map(locations.map((location) => [location.id, location]));
  const resolved: WebsiteBuilderLocation[] = [];
  const seen = new Set<number>();

  for (const id of preferredIds) {
    const location = byId.get(id);
    if (!location || seen.has(id)) continue;
    seen.add(id);
    resolved.push(location);
  }

  for (const location of locations) {
    if (seen.has(location.id)) continue;
    seen.add(location.id);
    resolved.push(location);
  }

  return resolved;
}

/** Apply the Locations section's order before its visibility filter. */
export function resolveVisibleLocations(
  config: LocationsConfig,
  locations: WebsiteBuilderLocation[],
): WebsiteBuilderLocation[] {
  const hidden = new Set(validLocationIds(config.hiddenLocationIds));
  return resolveOrderedLocations(config, locations).filter(
    (location) => !hidden.has(location.id),
  );
}

/**
 * The Locations section is the single website-wide source of location visibility and order. When it is
 * shown, every location-aware section follows that selection; when it is hidden, those sections retain
 * access to every owned location so hiding the Locations presentation cannot silently hide their content.
 */
export function resolvePreviewLocations(
  layout: PageLayout,
  locations: WebsiteBuilderLocation[],
): WebsiteBuilderLocation[] {
  const locationsEntry = layout.find(
    (entry) => entry.type === "locations" && entry.visible,
  );
  if (!locationsEntry) return locations;
  return resolveVisibleLocations(
    (locationsEntry.config ?? {}) as LocationsConfig,
    locations,
  );
}

/**
 * Canonicalize owner-scoped location references at the save boundary. Once an explicit order exists it is
 * materialized with every current location, so hidden locations retain their position and new locations
 * append deterministically. Missing/empty order remains the legacy API order.
 */
export function canonicalizeLocationsConfigForSave(
  config: Record<string, unknown>,
  locations: WebsiteBuilderLocation[],
): Record<string, unknown> {
  const next = { ...config };
  const ownedIds = new Set(locations.map((location) => location.id));

  next.hiddenLocationIds = [
    ...new Set(
      validLocationIds(next.hiddenLocationIds).filter((id) => ownedIds.has(id)),
    ),
  ];

  const hasExplicitOrder = validLocationIds(next.orderedLocationIds).length > 0;
  if (hasExplicitOrder) {
    next.orderedLocationIds = resolveOrderedLocations(
      { orderedLocationIds: validLocationIds(next.orderedLocationIds) },
      locations,
    ).map((location) => location.id);
  } else {
    delete next.orderedLocationIds;
  }

  return next;
}
