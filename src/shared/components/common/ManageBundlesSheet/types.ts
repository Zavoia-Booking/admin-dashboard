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
  icon?: React.ComponentType<{ className?: string }>;
  symbol?: string;
}
