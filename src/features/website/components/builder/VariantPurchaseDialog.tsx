import { useTranslation } from "react-i18next";
import { Loader2, Lock, LockOpen, Sparkles } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../../../../shared/components/ui/drawer";
import {
  modalEyebrow,
  modalTitleCompact,
  modalHelperSmall,
} from "../../../../shared/components/ui/modal-tokens";
import { Button } from "../../../../shared/components/ui/button";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import { usePlatform } from "../../../../shared/hooks/usePlatform";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import type { PriceFormatOptions } from "../../../../shared/utils/currency";
import type { WebsiteVariantCatalogEntry } from "../../types";

/**
 * One display string for a catalog price, always in full canonical form ("9.00 €") — the
 * house currency rule. Shared by the locked layout pills, the unlock tray, and this dialog
 * so the price always reads the same.
 */
export function variantPriceLabel(
  formatPrice: (amountMinor: number, currency: string, opts?: PriceFormatOptions) => string,
  variant: Pick<WebsiteVariantCatalogEntry, "priceMinor" | "currency">,
): string {
  return formatPrice(variant.priceMinor, variant.currency);
}

/** The fields the dialog needs — satisfied by both variant and section catalog entries. */
export type PurchasableCatalogItem = Pick<
  WebsiteVariantCatalogEntry,
  "id" | "name" | "description" | "priceMinor" | "currency"
>;

interface VariantPurchaseDialogProps<T extends PurchasableCatalogItem> {
  /** The locked catalog entry (variant or section unlock) being bought; null keeps the dialog closed. */
  variant: T | null;
  /** What is being unlocked — a section STYLE (variant) or a whole SECTION. Drives the copy. */
  kind?: "variant" | "section";
  onOpenChange: (open: boolean) => void;
  /** Plan includes the website builder — buying paid items requires it (Plus/trial). */
  hasWebsiteBuilder: boolean;
  /** Checkout session being created (ends with a redirect to Stripe). */
  isLoading: boolean;
  onBuy: (variant: T) => void;
  /** The item is already queued in the pending unlocks (toggles the queue button). */
  inCart?: boolean;
  /** Add to / remove from the pending unlocks (combined payment via the tray). */
  onToggleCart?: (variant: T) => void;
  /** How many OTHER items are already queued — "Unlock now" pays for this one alone. */
  pendingCount?: number;
}

/**
 * Purchase confirmation for a locked (paid, unowned) section layout or section unlock:
 * name, description, one-time price, "yours forever" note — then a Stripe checkout
 * redirect. When the plan lacks the website builder, a hint points at Account → Billing
 * (purchasing needs Plus); the buy attempt stays enabled and the server-side E05 toast
 * is the authority.
 */
export function VariantPurchaseDialog<T extends PurchasableCatalogItem>({
  variant,
  kind = "variant",
  onOpenChange,
  hasWebsiteBuilder,
  isLoading,
  onBuy,
  inCart = false,
  onToggleCart,
  pendingCount = 0,
}: VariantPurchaseDialogProps<T>) {
  const { t } = useTranslation("marketplace");
  const { formatPrice } = useFormatPrice();
  const { isNative } = usePlatform();
  const isMobile = useIsMobile();

  const price = variant ? variantPriceLabel(formatPrice, variant) : "";

  const eyebrow = (
    <span className={cn(modalEyebrow, "mb-0 flex items-center gap-1.5")}>
      <Lock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
      {kind === "section"
        ? t("businessPage.paidVariants.sectionEyebrow")
        : t("businessPage.paidVariants.eyebrow")}
    </span>
  );

  const content = variant && (
    isNative ? (
      <p className="mt-5 rounded-xl border border-border bg-surface-hover/60 px-4 py-3.5 text-[13px] leading-snug text-foreground-2">
        {t("businessPage.paidVariants.nativeHint")}
      </p>
    ) : (
      <>
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

        {/* "Unlock now" pays for this item alone — say so when others are already queued,
            so nobody ends up with two separate charges by surprise. */}
        {pendingCount > 0 && !inCart && (
          <p className="mt-3 text-[12px] leading-5 text-foreground-3">
            {t("businessPage.paidVariants.separateNote", { count: pendingCount })}
          </p>
        )}
      </>
    )
  );

  const footer = variant && (
    isNative ? (
      <Button type="button" variant="outline" disabled={isLoading} onClick={() => onOpenChange(false)}>
        {t("businessPage.paidVariants.cancel")}
      </Button>
    ) : (
      <>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => onOpenChange(false)}
        >
          {t("businessPage.paidVariants.cancel")}
        </Button>
        {onToggleCart && (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => {
              onToggleCart(variant);
              // Adding closes the dialog so the unlock tray takes over; removing stays put.
              if (!inCart) onOpenChange(false);
            }}
          >
            <LockOpen className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            {inCart
              ? t("businessPage.paidVariants.removeFromCart")
              : t("businessPage.paidVariants.addToCart")}
          </Button>
        )}
        <Button type="button" disabled={isLoading} onClick={() => onBuy(variant)}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isLoading
            ? t("businessPage.paidVariants.processing")
            : t("businessPage.paidVariants.buy", { price })}
        </Button>
      </>
    )
  );

  if (isMobile) {
    return (
      <Drawer open={!!variant} onOpenChange={(open) => !isLoading && onOpenChange(open)}>
        <DrawerContent className="max-h-[85vh] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {variant && (
            <>
              <DialogHeader className="gap-0 pt-1 text-left">
                {eyebrow}
                <DrawerTitle className={cn(modalTitleCompact, "mt-2")}>{variant.name}</DrawerTitle>
                <DrawerDescription className={cn(modalHelperSmall, "mt-1.5")}>
                  {variant.description ||
                    (kind === "section"
                      ? t("businessPage.paidVariants.sectionDefaultDescription")
                      : t("businessPage.paidVariants.defaultDescription"))}
                </DrawerDescription>
              </DialogHeader>
              {content}
              <DialogFooter className="mt-6">{footer}</DialogFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={!!variant} onOpenChange={(open) => !isLoading && onOpenChange(open)}>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-0 p-6 sm:max-w-[420px]">
        {variant && (
          <>
            <DialogHeader className="gap-0">
              {eyebrow}
              <DialogTitle className={cn(modalTitleCompact, "mt-2")}>{variant.name}</DialogTitle>
              <DialogDescription className={cn(modalHelperSmall, "mt-1.5")}>
                {variant.description ||
                    (kind === "section"
                      ? t("businessPage.paidVariants.sectionDefaultDescription")
                      : t("businessPage.paidVariants.defaultDescription"))}
              </DialogDescription>
            </DialogHeader>
            {content}
            <DialogFooter className="mt-6">{footer}</DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VariantPurchaseDialog;
