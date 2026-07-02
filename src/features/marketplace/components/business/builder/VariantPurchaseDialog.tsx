import { useTranslation } from "react-i18next";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../../shared/components/ui/dialog";
import {
  modalEyebrow,
  modalTitleCompact,
  modalHelperSmall,
} from "../../../../../shared/components/ui/modal-tokens";
import { Button } from "../../../../../shared/components/ui/button";
import { useFormatPrice } from "../../../../../shared/hooks/useFormatPrice";
import type { PriceFormatOptions } from "../../../../../shared/utils/currency";
import type { WebsiteVariantCatalogEntry } from "../../../types";

/**
 * One display string for a catalog price: whole amounts drop the decimals ("9 €"),
 * fractional ones keep them ("9.99 €"). Shared by the locked layout pills and this dialog
 * so the price always reads the same.
 */
export function variantPriceLabel(
  formatPrice: (amountMinor: number, currency: string, opts?: PriceFormatOptions) => string,
  variant: Pick<WebsiteVariantCatalogEntry, "priceMinor" | "currency">,
): string {
  return formatPrice(variant.priceMinor, variant.currency, {
    showDecimals: variant.priceMinor % 100 !== 0,
  });
}

interface VariantPurchaseDialogProps {
  /** The locked catalog entry being bought; null keeps the dialog closed. */
  variant: WebsiteVariantCatalogEntry | null;
  onOpenChange: (open: boolean) => void;
  /** Plan includes the website builder — buying paid variants requires it (Plus/trial). */
  hasWebsiteBuilder: boolean;
  /** Checkout session being created (ends with a redirect to Stripe). */
  isLoading: boolean;
  onBuy: (variant: WebsiteVariantCatalogEntry) => void;
}

/**
 * Purchase confirmation for a locked (paid, unowned) section layout: name, description,
 * one-time price, "yours forever" note — then a Stripe checkout redirect. When the plan
 * lacks the website builder, a hint points at Account → Billing (purchasing needs Plus);
 * the buy attempt stays enabled and the server-side E05 toast is the authority.
 */
export function VariantPurchaseDialog({
  variant,
  onOpenChange,
  hasWebsiteBuilder,
  isLoading,
  onBuy,
}: VariantPurchaseDialogProps) {
  const { t } = useTranslation("marketplace");
  const { formatPrice } = useFormatPrice();

  const price = variant ? variantPriceLabel(formatPrice, variant) : "";

  return (
    <Dialog open={!!variant} onOpenChange={(open) => !isLoading && onOpenChange(open)}>
      <DialogContent className="max-w-[420px] gap-0 p-6 sm:max-w-[420px]">
        {variant && (
          <>
            <DialogHeader className="gap-0">
              <span className={cn(modalEyebrow, "mb-0 flex items-center gap-1.5")}>
                <Lock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                {t("businessPage.paidVariants.eyebrow")}
              </span>
              <DialogTitle className={cn(modalTitleCompact, "mt-2")}>{variant.name}</DialogTitle>
              <DialogDescription className={cn(modalHelperSmall, "mt-1.5")}>
                {variant.description || t("businessPage.paidVariants.defaultDescription")}
              </DialogDescription>
            </DialogHeader>

            {/* price plate: the amount + the one-time / yours-forever promise */}
            <div className="mt-5 rounded-xl border border-border bg-surface-hover/60 px-4 py-3.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-semibold tracking-[-0.015em] text-foreground-1">
                  {price}
                </span>
                <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-foreground-3">
                  {t("businessPage.paidVariants.oneTime")}
                </span>
              </div>
              <p className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-foreground-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
                {t("businessPage.paidVariants.foreverNote")}
              </p>
            </div>

            {!hasWebsiteBuilder && (
              <p className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-2.5 text-[13px] leading-snug text-foreground-2 dark:bg-primary/[0.08]">
                {t("businessPage.paidVariants.plusHint")}
              </p>
            )}

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
              >
                {t("businessPage.paidVariants.cancel")}
              </Button>
              <Button type="button" disabled={isLoading} onClick={() => onBuy(variant)}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {isLoading
                  ? t("businessPage.paidVariants.processing")
                  : t("businessPage.paidVariants.buy", { price })}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VariantPurchaseDialog;
