import type { WebsiteBuilderLocation } from "../../../../../types";

/** Fewest items the marquee needs to read as an intentional band rather than a stray label or two. */
export const MARQUEE_MIN_ITEMS = 3;

/**
 * The strip's content for a business: deduplicated service names, falling back to broader categories
 * when only a couple of services are listed. The cap keeps service-heavy businesses visually calm.
 */
export function marqueeItems(locations: WebsiteBuilderLocation[]): string[] {
  const svcSeen = new Set<string>();
  const services: string[] = [];
  const catSeen = new Set<string>();
  const categories: string[] = [];

  for (const location of locations) {
    for (const service of location.services ?? []) {
      const name = service.name?.trim();
      if (name && !svcSeen.has(name.toLowerCase())) {
        svcSeen.add(name.toLowerCase());
        services.push(name);
      }

      const category = service.category?.name?.trim();
      if (category && !catSeen.has(category.toLowerCase())) {
        catSeen.add(category.toLowerCase());
        categories.push(category);
      }
    }
  }

  return (services.length >= MARQUEE_MIN_ITEMS ? services : categories).slice(0, 16);
}
