/** Opens a Marketplace workspace without requiring a published listing. */
export function getMarketplaceConfigurationPath(
  tab: "business" | "locations" | "reviews",
  locationId?: number,
): string {
  const params = new URLSearchParams({ tab, view: "configuration" });
  if (locationId != null) params.set("locationId", String(locationId));
  return `/marketplace?${params.toString()}`;
}
