export interface Bundle {
  bundleId: number;
  bundleName: string;
  priceType: "sum" | "fixed" | "discount";
  fixedPriceAmountMinor: number | null;
  discountPercentage: number | null;
  calculatedPriceAmountMinor: number;
  displayPrice: number;
  serviceCount: number;
}

export interface CurrencyDisplay {
  /** ISO 4217 code carried alongside icon/symbol so children can format
   *  numbers via the shared currency util without re-deriving it. */
  currency: string;
  icon?: React.ComponentType<{ className?: string }>;
  symbol?: string;
}
