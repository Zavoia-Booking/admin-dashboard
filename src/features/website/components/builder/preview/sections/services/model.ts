import { formatPriceMinor, formatPriceValueMinor, getCurrencyMinorUnits, getCurrencySymbol } from "../../../../../../../shared/utils/currency";
import type { WebsiteBuilderLocation } from "../../../../../types";
import type { MoneyDisplay, ServiceMenuGroup, ServiceMenuItem, ServicesCard, ServicesPage } from "./types";

function finiteNonNegative(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function serviceItem(service: WebsiteBuilderLocation["services"][number]): ServiceMenuItem {
  return {
    key: `service-${service.id}`,
    sourceId: service.id,
    name: service.name?.trim() || "",
    description: service.description?.trim() || "",
    duration: finiteNonNegative(service.duration),
    priceMinor: finiteNonNegative(service.price_amount_minor),
    isBundle: false,
    includes: [],
  };
}

/** Location assignments arrive service-like. Bundles are additive and live in their own design-source
 *  Packages group because the backend bundle entity has no category relation. */
export function buildServiceGroups(
  location: WebsiteBuilderLocation,
  categoryFallback: string,
  packagesLabel: string,
): ServiceMenuGroup[] {
  const groups = new Map<
    string,
    { key: string; name: string; items: ServiceMenuItem[]; order: number; insertion: number }
  >();

  (location.services ?? []).forEach((service, insertion) => {
    const categoryId = service.category?.id ?? service.categoryId ?? "uncategorized";
    const key = `category-${categoryId}`;
    const categoryName = service.category?.name?.trim() || categoryFallback;
    const categoryOrder = Number(service.category?.displayOrder);
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(serviceItem(service));
      return;
    }
    groups.set(key, {
      key,
      name: categoryName,
      items: [serviceItem(service)],
      order: Number.isFinite(categoryOrder) ? categoryOrder : Number.MAX_SAFE_INTEGER,
      insertion,
    });
  });

  const sorted = Array.from(groups.values())
    .sort((a, b) => a.order - b.order || a.insertion - b.insertion)
    .map(({ key, name, items }) => ({ key, name, items }));

  const bundles = (location.bundles ?? []).map((bundle): ServiceMenuItem => {
    const included = Array.isArray(bundle.includes)
      ? bundle.includes.filter((name): name is string => typeof name === "string" && !!name.trim()).map((name) => name.trim())
      : Array.isArray(bundle.services)
        ? bundle.services.map((service) => service.name?.trim()).filter((name): name is string => !!name)
        : [];
    return {
      key: `bundle-${bundle.id}`,
      sourceId: bundle.id,
      name: bundle.name?.trim() || "",
      description: bundle.description?.trim() || "",
      duration: finiteNonNegative(bundle.duration),
      priceMinor: finiteNonNegative(bundle.price_amount_minor),
      isBundle: true,
      includes: included,
    };
  });
  if (bundles.length) sorted.push({ key: "packages", name: packagesLabel, items: bundles });
  return sorted.filter((group) => group.items.length > 0);
}

export function minPrice(items: ServiceMenuItem[]): number {
  return items.length ? Math.min(...items.map((item) => item.priceMinor)) : 0;
}

export function serviceDuration(minutes: number): string {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${minutes} min`;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

function priceOptions(amountMinor: number, currency: string, locale: "en" | "ro") {
  const units = getCurrencyMinorUnits(currency);
  const scale = 10 ** units;
  return {
    locale: locale === "ro" ? "ro-RO" : "en-US",
    decimalPlaces: amountMinor % scale === 0 ? 0 : units,
  };
}

export function money(amountMinor: number, currency: string, locale: "en" | "ro"): MoneyDisplay {
  const options = priceOptions(amountMinor, currency, locale);
  return {
    full: formatPriceMinor(amountMinor, currency, options),
    value: formatPriceValueMinor(amountMinor, currency, options),
    symbol: getCurrencySymbol(currency),
  };
}

/** Maximum seven rows per poster page, matching the source exactly. */
export function buildBentoPages(groups: ServiceMenuGroup[]): ServicesPage[] {
  const pages: ServicesPage[] = [];
  groups.forEach((group) => {
    const chunks: ServiceMenuItem[][] = [];
    for (let index = 0; index < group.items.length; index += 7) {
      chunks.push(group.items.slice(index, index + 7));
    }
    (chunks.length ? chunks : [[]]).forEach((items, index) => {
      pages.push({
        key: `${group.key}-${index}`,
        category: group.name,
        items,
        categoryPage: index,
        categoryPages: chunks.length || 1,
        categoryTotal: group.items.length,
        categoryMin: minPrice(group.items),
      });
    });
  });
  return pages;
}

/** Organic 5–10 row card rhythm from the design source; long categories never leave a tiny tail. */
export function buildServiceCards(groups: ServiceMenuGroup[]): ServicesCard[] {
  const pattern = [7, 10, 8, 9, 6, 10, 7];
  const cards: ServicesCard[] = [];
  groups.forEach((group) => {
    const chunks: ServiceMenuItem[][] = [];
    let index = 0;
    let patternIndex = 0;
    while (index < group.items.length) {
      const remaining = group.items.length - index;
      if (remaining <= 10) {
        chunks.push(group.items.slice(index));
        break;
      }
      let size = pattern[patternIndex++ % pattern.length];
      if (remaining - size < 5) size = remaining - 5;
      size = Math.max(5, Math.min(10, size));
      chunks.push(group.items.slice(index, index + size));
      index += size;
    }
    (chunks.length ? chunks : [[]]).forEach((items, part) => {
      cards.push({
        key: `${group.key}-${part}`,
        category: group.name,
        items,
        categoryPart: part,
        categoryParts: chunks.length || 1,
        categoryTotal: group.items.length,
        categoryMin: minPrice(group.items),
      });
    });
  });
  return cards;
}
