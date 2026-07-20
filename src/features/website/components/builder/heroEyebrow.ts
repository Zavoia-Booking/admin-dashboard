import type { WebsiteBuilderLocation } from "../../types";

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * Builds the Hero's inherited location line from real business data. Keeping this in one helper means
 * the editor's Default value and every preview variant resolve exactly the same text.
 */
export function defaultHeroEyebrow(
  locations: WebsiteBuilderLocation[],
  t: Translate,
): string {
  if (locations.length === 1) {
    return locations[0].addressComponents?.city || "";
  }

  if (locations.length < 2) return "";

  const cities = new Set(
    locations
      .map((location) => location.addressComponents?.city)
      .filter((city): city is string => !!city),
  );
  const country = locations
    .map((location) => location.addressComponents?.country)
    .find(Boolean);
  const place = cities.size === 1 ? [...cities][0] : country;

  return place
    ? t("businessPage.builder.preview.hero.locationsAcross", {
        num: locations.length,
        place,
      })
    : t("businessPage.builder.preview.locationCount", {
        count: locations.length,
      });
}

