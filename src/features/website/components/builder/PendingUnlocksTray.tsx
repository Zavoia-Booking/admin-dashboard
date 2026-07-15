import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Loader2, Lock, LockOpen, X } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../shared/components/ui/dialog";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import { variantPriceLabel } from "./pricing";
import { displayFontFor } from "./theme";

/** One queued unlock — a paid style or a section unlock, resolved against the catalog. */
export interface UnlockLineItem {
  /** Stable render key across kinds (e.g. "section-3" / "variant-7"). */
  key: string;
  id: number;
  kind: "section" | "variant" | "color" | "font";
  name: string;
  priceMinor: number;
  currency: string;
  /** Canonical hex/font value for a real theme specimen. */
  value?: string;
  assetKey?: string;
}

interface PendingUnlocksProps {
  /** Queued lines already resolved against the catalog (unowned, paid). Empty hides the control. */
  entries: UnlockLineItem[];
  /** Combined checkout session being created (ends with a redirect to Stripe). */
  isLoading: boolean;
  /** Authoritative ownership/catalog reconciliation currently makes the tray read-only. */
  isBlocked?: boolean;
  onRemove: (item: UnlockLineItem) => void;
  onClear: () => void;
  onCheckout: () => void;
}

interface PendingUnlocksTriggerProps extends PendingUnlocksProps {
  /** Keep the existing workspace trigger by default; Atelier supplies compact desktop/mobile controls. */
  variant?: "default" | "atelier-header" | "atelier-mobile-bar";
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
  const { t } = useTranslation("website");
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
          disabled={props.isLoading || props.isBlocked}
          className="min-h-11 shrink-0 px-2 text-[12px] font-medium text-foreground-3 outline-none transition-colors hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
        >
          {t("businessPage.paidVariants.unlocks.clear")}
        </button>
      </div>
      <UnlockList {...props} showHeading={false} bare className="px-4 pb-3.5 pt-2" />
    </div>
  );
}

/**
 * Atelier's premium-selection trigger. The review surface uses one Radix dialog at every
 * viewport so keyboard focus, Escape, backdrop dismissal, and focus restoration stay identical.
 * CSS places it as the supplied top-right tray from 920px up and as a compact floating card
 * above the dashboard mobile navigation below 920px.
 */
export function PendingUnlocksTrigger({ variant = "default", ...props }: PendingUnlocksTriggerProps) {
  const { t } = useTranslation("website");
  const { formatPrice } = useFormatPrice();
  const [trayOpen, setTrayOpen] = useState(false);

  if (props.entries.length === 0) return null;

  const totalsByCurrency = unlockTotalsByCurrency(props.entries);
  const total = totalsByCurrency
    .map((subtotal) => variantPriceLabel(formatPrice, subtotal))
    .join(" + ");
  const interactionBlocked = props.isLoading || props.isBlocked;
  const trigger = variant === "atelier-header" ? (
    <button
      type="button"
      disabled={interactionBlocked}
      className="website-atelier-focus website-atelier-press relative flex h-8 shrink-0 items-center gap-[9px] whitespace-nowrap rounded-full border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] py-0 pl-[7px] pr-[9px] text-[12px] font-semibold text-[var(--atelier-ink)] after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] hover:border-[color-mix(in_srgb,var(--atelier-ink)_28%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={`${t("businessPage.paidVariants.unlocks.title")}: ${props.entries.length}, ${total}`}
    >
      <span className="grid size-[19px] shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--atelier-warning)_18%,var(--atelier-surface-strong))] text-[#9a7a2a] dark:text-[#d6b966]">
        <Lock className="size-2.5" strokeWidth={2.4} aria-hidden />
      </span>
      <span className="inline-flex items-baseline gap-1 tabular-nums">
        <span>{props.entries.length}</span>
        <span className="hidden min-[1120px]:inline">
          {t("businessPage.paidVariants.unlocks.compactLabel")}
        </span>
      </span>
      <span className="font-normal tabular-nums text-[var(--atelier-muted)]">{total}</span>
      <ChevronRight
        className="hidden size-[13px] text-[var(--atelier-muted-soft)] min-[1120px]:block"
        strokeWidth={2}
        aria-hidden
      />
    </button>
  ) : variant === "atelier-mobile-bar" ? (
    <button
      type="button"
      disabled={interactionBlocked}
      className="atelier-mobile-unlocks website-atelier-focus website-atelier-press disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={`${t("businessPage.paidVariants.unlocks.title")}: ${props.entries.length}, ${total}`}
    >
      <span className="atelier-mobile-unlocks-summary">
        <span className="atelier-mobile-unlocks-dot" aria-hidden />
        <span className="truncate">
          {t("businessPage.paidVariants.unlocks.mobileSummary", {
            count: props.entries.length,
            total,
          })}
        </span>
      </span>
      <span className="atelier-mobile-unlocks-review">
        {t("businessPage.paidVariants.unlocks.review")}
      </span>
    </button>
  ) : (
    <Button
      type="button"
      variant="outline"
      size="sm"
      rounded="default"
      disabled={interactionBlocked}
      className="relative min-h-11 gap-1.5 px-3 text-[12px] font-semibold"
      aria-label={t("businessPage.paidVariants.unlocks.title")}
    >
      <LockOpen className="size-4" strokeWidth={1.8} aria-hidden />
      <span>{t("businessPage.paidVariants.unlocks.triggerLabel")}</span>
      <span className="inline-flex min-w-4 justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
        {props.entries.length}
      </span>
    </Button>
  );

  return (
    <Dialog
      open={trayOpen}
      onOpenChange={(open) => {
        if (!interactionBlocked) setTrayOpen(open);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="website-atelier atelier-unlock-tray-dialog gap-0 p-4">
        <DialogHeader className="atelier-unlock-tray-header gap-0 pr-12 text-left">
          <div className="atelier-unlock-popover-heading">
            <DialogTitle>{t("businessPage.paidVariants.unlocks.title")}</DialogTitle>
            <span className="atelier-unlock-header-actions">
              <span className="tabular-nums">{props.entries.length}</span>
              <button
                type="button"
                onClick={props.onClear}
                disabled={interactionBlocked}
                className="atelier-unlock-clear website-atelier-focus"
              >
                {t("businessPage.paidVariants.unlocks.clear")}
              </button>
            </span>
          </div>
          <DialogDescription className="atelier-unlock-popover-hint text-pretty">
            {t("businessPage.paidVariants.unlocks.popoverHint")}
          </DialogDescription>
        </DialogHeader>
        <UnlockList
          {...props}
          showHeading={false}
          className="atelier-unlock-popover-list"
        />
      </DialogContent>
    </Dialog>
  );
}

function unlockTotalsByCurrency(entries: UnlockLineItem[]) {
  return Array.from(
    entries.reduce((groups, entry) => {
      const key = entry.currency.toUpperCase();
      const current = groups.get(key) ?? { currency: entry.currency, priceMinor: 0 };
      current.priceMinor += entry.priceMinor;
      groups.set(key, current);
      return groups;
    }, new Map<string, { currency: string; priceMinor: number }>()).values(),
  );
}

function UnlockList({
  entries,
  isLoading,
  isBlocked = false,
  onRemove,
  onClear,
  onCheckout,
  showHeading = true,
  bare = false,
  className,
}: UnlockListProps & { bare?: boolean }) {
  const { t } = useTranslation("website");
  const { formatPrice } = useFormatPrice();
  const interactionBlocked = isLoading || isBlocked;

  // A Stripe session accepts one currency. Keep subtotals separate rather than displaying
  // invalid arithmetic when regional catalog pricing differs.
  const totalsByCurrency = unlockTotalsByCurrency(entries);
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
            disabled={interactionBlocked}
            className="min-h-11 shrink-0 px-2 text-[12px] font-medium text-foreground-3 outline-none transition-colors hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
          >
            {t("businessPage.paidVariants.unlocks.clear")}
          </button>
        </div>
      ) : null}

      <ul
        className={cn("atelier-unlock-lines mb-3 space-y-1 overflow-y-auto", bare ? "max-h-40" : "max-h-52")}
        aria-live="polite"
      >
        {entries.map((entry) => {
          const kindLabel = t(
            entry.kind === "section"
              ? "businessPage.paidVariants.sectionEyebrow"
              : entry.kind === "variant"
                ? "businessPage.paidVariants.eyebrow"
                : entry.kind === "color"
                  ? "businessPage.theme.accentColor"
                  : "businessPage.theme.fontLabel",
          );

          return (
            <li key={entry.key} className="atelier-unlock-line">
              <UnlockSpecimen entry={entry} />
              <span className="min-w-0 flex-1">
                <span className="atelier-unlock-line-title block truncate text-[12.5px] font-medium text-[var(--atelier-ink)]" title={entry.name}>
                  {entry.name}
                </span>
                <span className="atelier-unlock-line-kind mt-0.5 block truncate text-[10.5px] text-[var(--atelier-muted)]">
                  {kindLabel}
                </span>
              </span>
              <span className="atelier-unlock-line-price shrink-0 font-mono text-[11.5px] tabular-nums text-[var(--atelier-ink-soft)]">
                {variantPriceLabel(formatPrice, entry)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(entry)}
                disabled={interactionBlocked}
                aria-label={t("businessPage.paidVariants.unlocks.removeAria", { name: entry.name })}
                className="website-atelier-focus atelier-unlock-remove relative grid size-6 shrink-0 place-items-center rounded-[7px] text-[var(--atelier-muted-soft)] outline-none before:absolute before:-inset-[10px] before:content-[''] transition-colors hover:bg-[var(--atelier-field)] hover:text-[var(--atelier-ink)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="size-3" strokeWidth={1.9} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="atelier-unlock-summary border-t border-[var(--atelier-border-soft)] pt-3">
        {hasMixedCurrencies ? (
          <p id="website-unlocks-currency-note" className="mb-2 text-xs leading-5 text-warning" role="status">
            {t("businessPage.paidVariants.unlocks.mixedCurrency")}
          </p>
        ) : null}
        <div className="atelier-unlock-total flex items-baseline justify-between gap-3 px-0.5">
          <p>{totalLabel}</p>
          <p className="text-[16px] font-semibold tabular-nums text-[var(--atelier-ink)]">{total}</p>
        </div>
        <Button
          type="button"
          disabled={interactionBlocked || hasMixedCurrencies}
          aria-describedby={hasMixedCurrencies ? "website-unlocks-currency-note" : undefined}
          onClick={onCheckout}
          className="atelier-unlock-checkout relative mt-3 h-[38px] min-h-0 w-full before:absolute before:-inset-y-[3px] before:inset-x-0 before:content-['']"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {isLoading
            ? t("businessPage.paidVariants.processing")
            : t("businessPage.paidVariants.unlocks.complete")}
        </Button>
      </div>
    </div>
  );
}

/** Compact composition specimen matching the artifact's preview language. Catalog line items do
 * not include thumbnail geometry, so the two real unlock kinds use distinct, deterministic
 * schematics instead of unrelated generic icons. */
function UnlockSpecimen({ entry }: { entry: UnlockLineItem }) {
  if (entry.kind === "color") {
    return (
      <span
        className="atelier-unlock-specimen atelier-unlock-specimen--color"
        style={{ backgroundColor: entry.value }}
        aria-hidden
      />
    );
  }
  if (entry.kind === "font") {
    const font = displayFontFor(entry.assetKey ?? entry.value);
    return (
      <span
        className="atelier-unlock-specimen atelier-unlock-specimen--font"
        style={{ fontFamily: font.stack, fontWeight: font.weight }}
        aria-hidden
      >
        Aa
      </span>
    );
  }
  return (
    <span className="atelier-unlock-specimen" data-kind={entry.kind} aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
