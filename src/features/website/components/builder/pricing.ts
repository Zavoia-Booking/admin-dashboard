import type { PriceFormatOptions } from "../../../../shared/utils/currency";
import type { WebsiteVariantCatalogEntry } from "../../types";

/**
 * Canonical catalogue price formatting shared by locked controls, the unlock tray, and purchase
 * surfaces. Keeping it outside a component module also lets Vite Fast Refresh treat each UI file
 * as a component-only module.
 */
export function variantPriceLabel(
  formatPrice: (amountMinor: number, currency: string, opts?: PriceFormatOptions) => string,
  variant: Pick<WebsiteVariantCatalogEntry, "priceMinor" | "currency">,
): string {
  return formatPrice(variant.priceMinor, variant.currency);
}
