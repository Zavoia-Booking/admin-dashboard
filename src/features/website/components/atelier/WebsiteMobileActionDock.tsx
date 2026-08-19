import { ChevronRight, LoaderCircle, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import { cn } from "../../../../shared/lib/utils";
import { useKeyboardVisible } from "../../../../shared/hooks/useKeyboardVisible";
import type { UnlockLineItem } from "../builder/PendingUnlocksTray";
import { unlockTotalsByCurrency, variantPriceLabel } from "../builder/pricing";

interface MobilePurchaseAction {
  entries: UnlockLineItem[];
  disabled?: boolean;
  disabledReason?: string | null;
  busy?: boolean;
  onReview: () => void;
}

interface MobilePublishAction {
  /** null when there's nothing to add beyond what the header caption already says. */
  summary: string | null;
  /** State-aware action label (mirrors the header/kebab publish label). Falls back to a
   * generic "review" label when omitted. */
  label?: string;
  disabled?: boolean;
  disabledReason?: string | null;
  busy?: boolean;
  onReview: () => void;
}

interface WebsiteMobileActionDockProps {
  purchase?: MobilePurchaseAction | null;
  publish?: MobilePublishAction | null;
}

/**
 * Phone-first action dock. Purchasing and publishing stay separate intents even when both
 * are available: each control opens the shared review dialog in its own mode.
 */
export function WebsiteMobileActionDock({
  purchase,
  publish,
}: WebsiteMobileActionDockProps) {
  const { t } = useTranslation("website");
  const { formatPrice } = useFormatPrice();
  // Native keyboard covers the dock (fixed-bottom at phone widths) instead of pushing it up.
  const keyboardVisible = useKeyboardVisible();

  if (!purchase && !publish) return null;

  const purchaseTotal = purchase
    ? unlockTotalsByCurrency(purchase.entries)
        .map((subtotal) => variantPriceLabel(formatPrice, subtotal))
        .join(" + ")
    : "";
  const purchaseSummary = purchase
    ? t("page.mobileActions.unlockSummary", {
        count: purchase.entries.length,
        total: purchaseTotal,
      })
    : "";
  const purchaseLabel = purchase?.busy
    ? t("businessPage.paidVariants.processing")
    : t("page.mobileActions.reviewUnlocks");
  const publishLabel = publish?.busy
    ? t("page.status.publishing")
    : (publish?.label ?? t("page.mobileActions.reviewSite"));
  const visiblePublishLabel =
    purchase && publish?.disabled && publish.disabledReason
      ? publish.disabledReason
      : publishLabel;
  // Whatever a failure/blocker/upsell reason has to say takes priority over the plain summary;
  // when neither exists there's nothing left to add beyond the header's own state caption.
  const publishSummaryText = publish
    ? publish.disabled && publish.disabledReason
      ? publish.disabledReason
      : publish.summary
    : null;

  return (
    <div
      className={cn(
        "atelier-mobile-action-dock",
        purchase && publish && "atelier-mobile-action-dock--dual",
        // Amber ("unlock") skin stays reserved for a real pending purchase; a plain publish
        // reminder isn't a paid/premium moment and shouldn't borrow that visual language.
        !purchase && publish && "atelier-mobile-action-dock--neutral",
        !purchase && publish && !publishSummaryText && "atelier-mobile-action-dock--solo",
        keyboardVisible && "hidden",
      )}
      role="group"
      aria-label={t("page.mobileActions.ariaLabel")}
    >
      {purchase ? (
        <button
          type="button"
          disabled={purchase.disabled || purchase.busy}
          onClick={purchase.onReview}
          title={purchase.disabledReason ?? undefined}
          aria-label={`${purchaseLabel}: ${purchaseSummary}${
            purchase.disabledReason ? `, ${purchase.disabledReason}` : ""
          }`}
          aria-busy={purchase.busy}
          className="atelier-mobile-action-dock__purchase website-atelier-focus website-atelier-press"
        >
          <span className="atelier-mobile-action-dock__icon" aria-hidden>
            {purchase.busy ? (
              <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : (
              <Lock className="size-3" strokeWidth={2.2} />
            )}
          </span>
          <span className="atelier-mobile-action-dock__copy">
            {purchase.disabled && purchase.disabledReason
              ? purchase.disabledReason
              : purchaseSummary}
          </span>
          <span className="atelier-mobile-action-dock__purchase-label">
            {purchaseLabel}
          </span>
          <ChevronRight className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      ) : publish && publishSummaryText ? (
        <span className="atelier-mobile-action-dock__summary" aria-live="polite">
          <span className="atelier-mobile-action-dock__status-dot" aria-hidden />
          <span className="truncate">{publishSummaryText}</span>
        </span>
      ) : null}

      {publish ? (
        <button
          type="button"
          disabled={publish.disabled || publish.busy}
          onClick={publish.onReview}
          title={publish.disabledReason ?? undefined}
          aria-label={`${publishLabel}${
            publish.disabledReason ? `: ${publish.disabledReason}` : ""
          }`}
          aria-busy={publish.busy}
          className="atelier-mobile-action-dock__publish website-atelier-focus website-atelier-press"
        >
          {publish.busy ? (
            <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : null}
          <span className="atelier-mobile-action-dock__publish-label">
            {visiblePublishLabel}
          </span>
        </button>
      ) : null}
    </div>
  );
}
