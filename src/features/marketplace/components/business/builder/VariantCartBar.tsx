import { useTranslation } from "react-i18next";
import { Loader2, ShoppingCart, X } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import { Button } from "../../../../../shared/components/ui/button";
import { useFormatPrice } from "../../../../../shared/hooks/useFormatPrice";
import { variantPriceLabel } from "./VariantPurchaseDialog";

/** One cart line — a paid variant or a section unlock, resolved against the catalog. */
export interface CartLineItem {
  /** Stable render key across kinds (e.g. "section-3" / "variant-7"). */
  key: string;
  id: number;
  kind: "section" | "variant";
  name: string;
  priceMinor: number;
  currency: string;
}

interface VariantCartBarProps {
  /** Cart lines already resolved against the catalog (unowned, paid). Empty hides the bar. */
  entries: CartLineItem[];
  /** Combined checkout session being created (ends with a redirect to Stripe). */
  isLoading: boolean;
  onRemove: (item: CartLineItem) => void;
  onClear: () => void;
  onCheckout: () => void;
}

/**
 * Floating shopping cart for premium layouts and section unlocks: the items queued
 * via "Add to cart", their one-time prices and the total, checked out together in
 * a single Stripe session. Renders nothing while the cart is empty.
 */
export function VariantCartBar({ entries, isLoading, onRemove, onClear, onCheckout }: VariantCartBarProps) {
  const { t } = useTranslation("marketplace");
  const { formatPrice } = useFormatPrice();

  if (entries.length === 0) return null;

  // Catalog prices are resolved per business country, so entries share one currency;
  // a mixed cart would be rejected server-side anyway.
  const totalMinor = entries.reduce((sum, e) => sum + e.priceMinor, 0);
  const total = variantPriceLabel(formatPrice, { priceMinor: totalMinor, currency: entries[0].currency });

  return (
    <div
      className={cn(
        "fixed left-1/2 z-40 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2",
        // Below md the global bottom nav exists (app-layout gates it on the same 768px breakpoint) —
        // clear it plus the safe area. Pure CSS so the very first paint is already correct.
        "bottom-[calc(76px+env(safe-area-inset-bottom,0px)+16px)] md:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]",
        "rounded-2xl border border-border bg-surface p-4 shadow-lg",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300",
      )}
      role="region"
      aria-label={t("businessPage.paidVariants.cart.title")}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-foreground-1">
          <ShoppingCart className="h-4 w-4 text-primary" strokeWidth={1.8} aria-hidden />
          {t("businessPage.paidVariants.cart.title")}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
            {entries.length}
          </span>
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={isLoading}
          className="text-[12px] font-medium text-foreground-3 outline-none transition-colors hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
        >
          {t("businessPage.paidVariants.cart.clear")}
        </button>
      </div>

      <ul className="mb-3 max-h-44 space-y-1.5 overflow-y-auto">
        {entries.map((entry) => (
          <li
            key={entry.key}
            className="flex items-center justify-between gap-2 rounded-lg bg-surface-hover/60 px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-[13px] text-foreground-2" title={entry.name}>
              {entry.name}
            </span>
            <span className="shrink-0 text-[13px] font-medium tabular-nums text-foreground-1">
              {variantPriceLabel(formatPrice, entry)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(entry)}
              disabled={isLoading}
              aria-label={t("businessPage.paidVariants.cart.removeAria", { name: entry.name })}
              className="grid size-6 shrink-0 place-items-center rounded-full text-foreground-3 outline-none transition-colors hover:bg-surface-active hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-3">
            {t("businessPage.paidVariants.cart.totalLabel")}
          </p>
          <p className="text-[17px] font-semibold tabular-nums text-foreground-1">{total}</p>
        </div>
        <Button type="button" disabled={isLoading} onClick={onCheckout}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isLoading
            ? t("businessPage.paidVariants.processing")
            : t("businessPage.paidVariants.cart.checkout")}
        </Button>
      </div>
    </div>
  );
}

export default VariantCartBar;
