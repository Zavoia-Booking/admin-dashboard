import type { WebsiteBuilderLocation } from "../../types";

type FooterHeadlineCopy = {
  key:
    | "businessPage.builder.preview.footerComeFind"
    | "businessPage.builder.preview.contactHeadingLoc";
  options?: { name: string };
};

/**
 * Resolve Editorial's inherited closing headline from the same location scope and selection used by
 * its preview. Returning translation input instead of translated text keeps this shared by the editor
 * and renderer without coupling either one to a particular i18n hook.
 */
export function footerDefaultHeadlineCopy(
  locations: Pick<WebsiteBuilderLocation, "id" | "name">[],
  selectedLocationId: number | null | undefined,
): FooterHeadlineCopy {
  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ?? locations[0] ?? null;

  if (locations.length > 1 || !selectedLocation) {
    return { key: "businessPage.builder.preview.footerComeFind" };
  }

  return {
    key: "businessPage.builder.preview.contactHeadingLoc",
    options: { name: selectedLocation.name },
  };
}
