import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, LockOpen, X } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../../shared/components/ui/sheet";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import { variantPriceLabel } from "./VariantPurchaseDialog";

/** One queued unlock — a paid style or a section unlock, resolved against the catalog. */
export interface UnlockLineItem {
  /** Stable render key across kinds (e.g. "section-3" / "variant-7"). */
  key: string;
  id: number;
  kind: "section" | "variant";
  name: string;
  priceMinor: number;
  currency: string;
}

interface PendingUnlocksProps {
  /** Queued lines already resolved against the catalog (unowned, paid). Empty hides the control. */
  entries: UnlockLineItem[];
  /** Combined checkout session being created (ends with a redirect to Stripe). */
  isLoading: boolean;
  onRemove: (item: UnlockLineItem) => void;
  onClear: () => void;
  onCheckout: () => void;
}

interface UnlockListProps extends PendingUnlocksProps {
  showHeading?: boolean;
  className?: string;
}

/**
 * Docked tray for the sticky preview panel (xl desktop): the queued unlocks stay in view
 * under the live preview instead of hiding behind a popover. Renders nothing while empty.
 */
export function PendingUnlocksPanel(props: PendingUnlocksProps) {
  const { t } = useTranslation("marketplace");
  if (props.entries.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-border bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <span className="inline-flex min-w-0 items-center gap-2 text-[13px] font-semibold text-foreground-1">
          <LockOpen className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
          <span className="truncate">{t("businessPage.paidVariants.unlocks.title")}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
            {props.entries.length}
          </span>
        </span>
        <button
          type="button"
          onClick={props.onClear}
          disabled={props.isLoading}
          className="shrink-0 px-1 py-1 text-[12px] font-medium text-foreground-3 outline-none transition-colors hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
        >
          {t("businessPage.paidVariants.unlocks.clear")}
        </button>
      </div>
      <UnlockList {...props} showHeading={false} bare className="px-4 pb-3.5 pt-2" />
    </div>
  );
}

/**
 * Compact trigger + sheet for everything below xl: a side sheet on landscape tablet, a
 * bottom sheet on portrait tablet/phone. It never covers the editor by default.
 */
export function PendingUnlocksTrigger(props: PendingUnlocksProps) {
  const { t } = useTranslation("marketplace");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tabletLandscape, setTabletLandscape] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (max-width: 1279px) and (orientation: landscape)");
    const update = () => setTabletLandscape(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (props.entries.length === 0) return null;

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          rounded="default"
          className="relative min-h-11 gap-1.5 px-3 text-[12px] font-semibold"
          aria-label={t("businessPage.paidVariants.unlocks.title")}
        >
          <LockOpen className="size-4" strokeWidth={1.8} aria-hidden />
          <span>{t("businessPage.paidVariants.unlocks.triggerLabel")}</span>
          <span className="inline-flex min-w-4 justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
            {props.entries.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side={tabletLandscape ? "right" : "bottom"}
        overlayClassName="z-[70]"
        className={cn(
          "z-[70] gap-0 p-0",
          tabletLandscape
            ? "!w-[min(420px,100vw)] !max-w-none border-y-0 border-r-0"
            : "max-h-[min(80dvh,640px)] rounded-t-lg border-x-0 border-b-0",
        )}
      >
        <SheetHeader className="border-b border-border px-4 py-3.5 pr-12 text-left">
          <SheetTitle className="text-[15px]">{t("businessPage.paidVariants.unlocks.title")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("businessPage.paidVariants.unlocks.title")}
          </SheetDescription>
        </SheetHeader>
        <UnlockList
          {...props}
          showHeading={false}
          className={cn(
            "overflow-y-auto p-4",
            !tabletLandscape && "pb-[calc(1rem+env(safe-area-inset-bottom))]",
          )}
        />
      </SheetContent>
    </Sheet>
  );
}

function UnlockList({
  entries,
  isLoading,
  onRemove,
  onClear,
  onCheckout,
  showHeading = true,
  bare = false,
  className,
}: UnlockListProps & { bare?: boolean }) {
  const { t } = useTranslation("marketplace");
  const { formatPrice } = useFormatPrice();

  // A Stripe session accepts one currency. Keep subtotals separate rather than displaying
  // invalid arithmetic when regional catalog pricing differs.
  const totalsByCurrency = Array.from(
    entries.reduce((groups, entry) => {
      const key = entry.currency.toUpperCase();
      const current = groups.get(key) ?? { currency: entry.currency, priceMinor: 0 };
      current.priceMinor += entry.priceMinor;
      groups.set(key, current);
      return groups;
    }, new Map<string, { currency: string; priceMinor: number }>()).values(),
  );
  const hasMixedCurrencies = totalsByCurrency.length > 1;
  const total = totalsByCurrency
    .map((subtotal) => variantPriceLabel(formatPrice, subtotal))
    .join(" + ");
  const totalLabel = hasMixedCurrencies
    ? t("businessPage.paidVariants.unlocks.subtotalsLabel")
    : t("businessPage.paidVariants.unlocks.totalLabel");

  return (
    <div
      className={cn(!bare && "p-4", className)}
      role="region"
      aria-label={t("businessPage.paidVariants.unlocks.title")}
    >
      {showHeading ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-2 text-[13px] font-semibold text-foreground-1">
            <LockOpen className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
            <span className="truncate">{t("businessPage.paidVariants.unlocks.title")}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
              {entries.length}
            </span>
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={isLoading}
            className="min-h-11 shrink-0 px-1 text-[12px] font-medium text-foreground-3 outline-none transition-colors hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50 xl:min-h-9"
          >
            {t("businessPage.paidVariants.unlocks.clear")}
          </button>
        </div>
      ) : null}

      <ul className={cn("mb-3 space-y-1.5 overflow-y-auto", bare ? "max-h-40" : "max-h-52")} aria-live="polite">
        {entries.map((entry) => (
          <li
            key={entry.key}
            className="flex items-center justify-between gap-2 rounded-lg bg-surface-hover/60 px-3 py-1.5"
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
              aria-label={t("businessPage.paidVariants.unlocks.removeAria", { name: entry.name })}
              className={cn(
                "grid shrink-0 place-items-center rounded-md text-foreground-3 outline-none transition-colors hover:bg-surface-active hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50",
                bare ? "size-8" : "size-11 xl:size-9",
              )}
            >
              <X className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-border-subtle pt-3">
        {hasMixedCurrencies ? (
          <p id="website-unlocks-currency-note" className="mb-2 text-xs leading-5 text-warning" role="status">
            {t("businessPage.paidVariants.unlocks.mixedCurrency")}
          </p>
        ) : null}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-3">
              {totalLabel}
            </p>
            <p className="text-[17px] font-semibold tabular-nums text-foreground-1">{total}</p>
          </div>
          <Button
            type="button"
            disabled={isLoading || hasMixedCurrencies}
            aria-describedby={hasMixedCurrencies ? "website-unlocks-currency-note" : undefined}
            onClick={onCheckout}
            className={cn("shrink-0", bare ? "min-h-10" : "min-h-11 xl:min-h-10")}
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {isLoading
              ? t("businessPage.paidVariants.processing")
              : t("businessPage.paidVariants.unlocks.complete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
