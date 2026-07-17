import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
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
import { Spinner } from "../../../../shared/components/ui/spinner";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import { usePlatform } from "../../../../shared/hooks/usePlatform";
import type { WebsiteVariantCatalogEntry } from "../../types";
import { useAtelierCompactLayout } from "../atelier/useAtelierCompactLayout";
import { variantPriceLabel } from "./pricing";

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
  /** Independent server entitlement. False keeps the item inspectable but removes
   *  every cart/checkout action instead of rendering a button with no operation. */
  canPurchase?: boolean;
  /** Checkout session being created (ends with a redirect to Stripe). */
  isLoading: boolean;
  /** Catalog/ownership reconciliation makes purchase mutations temporarily read-only. */
  isBlocked?: boolean;
  /** Stripe redirects away, so checkout waits for unrelated local draft edits to be saved. */
  checkoutBlocked?: boolean;
  onBuy?: (variant: T) => void;
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
 * redirect. When purchase access is unavailable, a hint points at Account → Billing and
 * checkout/cart actions are omitted; the locked option remains inspectable.
 */
export function VariantPurchaseDialog<T extends PurchasableCatalogItem>({
  variant,
  kind = "variant",
  onOpenChange,
  hasWebsiteBuilder,
  canPurchase = true,
  isLoading,
  isBlocked = false,
  checkoutBlocked = false,
  onBuy,
  inCart = false,
  onToggleCart,
  pendingCount = 0,
}: VariantPurchaseDialogProps<T>) {
  const { t } = useTranslation("website");
  const { formatPrice } = useFormatPrice();
  const { isNative } = usePlatform();
  const isAtelierCompact = useAtelierCompactLayout();

  const price = variant ? variantPriceLabel(formatPrice, variant) : "";
  const hasFooterActions = isNative || (canPurchase && (!!onToggleCart || !!onBuy));

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
        <div className="atelier-purchase-price mt-5 rounded-xl border border-[var(--atelier-border)] bg-[var(--atelier-field)] px-4 py-3.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-semibold tabular-nums text-[var(--atelier-ink)]">
              {price}
            </span>
            <span className="font-mono text-[10px] font-medium uppercase text-[var(--atelier-muted)]">
              {t("businessPage.paidVariants.oneTime")}
            </span>
          </div>
          <p className="mt-1.5 text-pretty text-[13px] leading-snug text-[var(--atelier-ink-soft)]">
            {t("businessPage.paidVariants.foreverNote")}
          </p>
        </div>

        {(!hasWebsiteBuilder || !canPurchase) && (
          <p className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-2.5 text-[13px] leading-snug text-foreground-2 dark:bg-primary/[0.08]">
            {t(
              hasWebsiteBuilder
                ? "businessPage.paidVariants.purchaseUnavailable"
                : "businessPage.paidVariants.plusHint",
            )}
          </p>
        )}

        {canPurchase && checkoutBlocked ? (
          <p className="mt-3 rounded-xl border border-warning-border bg-warning-bg px-4 py-2.5 text-[13px] leading-snug text-warning" role="status">
            {t("businessPage.paidVariants.saveBeforeCheckout")}
          </p>
        ) : null}

        {/* "Unlock now" pays for this item alone — say so when others are already queued,
            so nobody ends up with two separate charges by surprise. */}
        {canPurchase && pendingCount > 0 && !inCart && (
          <p className="mt-3 text-[12px] leading-5 text-foreground-3">
            {t("businessPage.paidVariants.separateNote", { count: pendingCount })}
          </p>
        )}
      </>
    )
  );

  const footer = variant && (
    isNative ? (
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={() => onOpenChange(false)}
        className="min-h-11"
      >
        {t("businessPage.paidVariants.cancel")}
      </Button>
    ) : (
      <>
        {canPurchase && onToggleCart && (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isBlocked}
            onClick={() => {
              onToggleCart(variant);
              // Adding closes the dialog so the unlock tray takes over; removing stays put.
              if (!inCart) onOpenChange(false);
            }}
            className="min-h-11"
          >
            {inCart
              ? t("businessPage.paidVariants.removeFromUnlocks")
              : t("businessPage.paidVariants.addToUnlocks")}
          </Button>
        )}
        {canPurchase && onBuy ? (
          <Button
            type="button"
            disabled={isLoading || isBlocked || checkoutBlocked}
            onClick={() => onBuy(variant)}
            className="min-h-11"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <Spinner size="sm" color="white" />
            ) : (
              t("businessPage.paidVariants.previewBuy", { price })
            )}
          </Button>
        ) : null}
      </>
    )
  );

  if (isAtelierCompact) {
    return (
      <Drawer open={!!variant} onOpenChange={(open) => !isLoading && onOpenChange(open)}>
        <DrawerContent
          overlayClassName="z-[79]"
          className="website-atelier atelier-purchase-dialog z-[80] max-h-[85dvh] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          {variant && (
            <>
              <DialogHeader className="gap-0 pt-1 text-left">
                {eyebrow}
                <DrawerTitle className={cn(modalTitleCompact, "mt-2")}>{t("businessPage.paidVariants.unlockTitle", { name: variant.name })}</DrawerTitle>
                <DrawerDescription className={cn(modalHelperSmall, "mt-1.5")}>
                  {variant.description ||
                    (kind === "section"
                      ? t("businessPage.paidVariants.sectionDefaultDescription")
                      : t("businessPage.paidVariants.defaultDescription"))}
                </DrawerDescription>
              </DialogHeader>
              {content}
              {hasFooterActions ? (
                <DialogFooter className="atelier-purchase-footer mt-6 flex-col-reverse sm:flex-col-reverse">{footer}</DialogFooter>
              ) : null}
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={!!variant} onOpenChange={(open) => !isLoading && onOpenChange(open)}>
      <DialogContent
        overlayClassName="z-[79]"
        className="website-atelier atelier-purchase-dialog z-[80] max-w-[calc(100%-2rem)] gap-0 p-6 sm:max-w-[420px]"
      >
        {variant && (
          <>
            <DialogHeader className="gap-0">
              {eyebrow}
              <DialogTitle className={cn(modalTitleCompact, "mt-2")}>{t("businessPage.paidVariants.unlockTitle", { name: variant.name })}</DialogTitle>
              <DialogDescription className={cn(modalHelperSmall, "mt-1.5")}>
                {variant.description ||
                    (kind === "section"
                      ? t("businessPage.paidVariants.sectionDefaultDescription")
                      : t("businessPage.paidVariants.defaultDescription"))}
              </DialogDescription>
            </DialogHeader>
            {content}
            {hasFooterActions ? (
              <DialogFooter className="atelier-purchase-footer mt-6 flex-wrap">{footer}</DialogFooter>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VariantPurchaseDialog;
