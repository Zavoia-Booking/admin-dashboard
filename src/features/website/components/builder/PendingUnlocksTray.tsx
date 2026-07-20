import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Lock, LockOpen, X } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/ui/button";
import { Spinner } from "../../../../shared/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../shared/components/ui/dialog";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import { unlockTotalsByCurrency, variantPriceLabel } from "./pricing";
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

export interface PendingUnlocksProps {
  /** Queued lines already resolved against the catalog (unowned, paid). Empty hides the control. */
  entries: UnlockLineItem[];
  /** Combined checkout session being created (ends with a redirect to Stripe). */
  isLoading: boolean;
  /** Authoritative ownership/catalog reconciliation currently makes the tray read-only. */
  isBlocked?: boolean;
  /** The draft is dirty but can be saved as the first step of this checkout action. */
  checkoutRequiresSave?: boolean;
  /** The latest matching draft save failed and the combined action will retry it. */
  checkoutRetrySave?: boolean;
  /** The exact save requested by this tray is awaiting acknowledgement. */
  isSavingBeforeCheckout?: boolean;
  /** A real save blocker (offline, invalid, conflicted, or another mutation) prevents checkout. */
  checkoutDisabled?: boolean;
  checkoutDisabledReason?: string | null;
  onRemove: (item: UnlockLineItem) => void;
  onClear: () => void;
  onCheckout: () => void;
  /** Closing during the save phase cancels only the automatic checkout continuation. */
  onOpenChange?: (open: boolean) => void;
}

interface PendingUnlocksTriggerProps extends PendingUnlocksProps {
  /** Keep the existing workspace trigger by default; Atelier supplies compact desktop/mobile controls. */
  variant?: "default" | "atelier-header" | "atelier-mobile-bar";
  /** Workspace-owned review dialog. Omit to retain the self-contained legacy dialog. */
  onReview?: () => void;
}

interface UnlockListProps extends PendingUnlocksProps {
  showHeading?: boolean;
  grouped?: boolean;
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
 * Atelier's premium-selection trigger. The current workspace supplies `onReview` and owns one
 * shared review dialog; callers that omit it retain the self-contained legacy dialog.
 */
export function PendingUnlocksTrigger({
  variant = "default",
  onReview,
  ...props
}: PendingUnlocksTriggerProps) {
  const { t } = useTranslation("website");
  const { formatPrice } = useFormatPrice();
  const [trayOpen, setTrayOpen] = useState(false);
  const previousEntryCountRef = useRef(props.entries.length);
  const [changeAnimating, setChangeAnimating] = useState(false);

  useEffect(() => {
    const previousCount = previousEntryCountRef.current;
    const nextCount = props.entries.length;
    previousEntryCountRef.current = nextCount;

    if (nextCount === previousCount) {
      return;
    }

    setChangeAnimating(false);
    let playFrame = 0;
    let settleTimer = 0;
    const restartFrame = window.requestAnimationFrame(() => {
      playFrame = window.requestAnimationFrame(() => {
        setChangeAnimating(true);
        settleTimer = window.setTimeout(() => setChangeAnimating(false), 860);
      });
    });

    return () => {
      window.cancelAnimationFrame(restartFrame);
      window.cancelAnimationFrame(playFrame);
      window.clearTimeout(settleTimer);
    };
  }, [props.entries.length]);

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
      onClick={onReview}
      className={cn(
        "atelier-unlocks-trigger website-atelier-focus website-atelier-press relative flex h-8 shrink-0 items-center gap-[9px] whitespace-nowrap rounded-full border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] py-0 pl-[7px] pr-[9px] text-[12px] font-semibold text-[var(--atelier-ink)] after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] hover:border-[color-mix(in_srgb,var(--atelier-ink)_28%,transparent)] disabled:cursor-not-allowed disabled:opacity-60",
        changeAnimating && "atelier-unlocks-trigger--changed",
      )}
      aria-label={`${t("businessPage.paidVariants.unlocks.title")}: ${props.entries.length}, ${total}`}
    >
      <span className="relative grid size-[21px] shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--atelier-accent)_14%,var(--atelier-surface-strong))] text-[var(--atelier-accent)]">
        <span
          className="absolute inset-0 animate-ping rounded-full bg-[var(--atelier-accent)] opacity-20"
          style={{ animationDuration: "3s" }}
          aria-hidden
        />
        <Lock className="relative size-2.5" strokeWidth={2.4} aria-hidden />
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
      onClick={onReview}
      className={cn(
        "atelier-unlocks-trigger atelier-mobile-unlocks website-atelier-focus website-atelier-press disabled:cursor-not-allowed disabled:opacity-60",
        changeAnimating && "atelier-unlocks-trigger--changed",
      )}
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
      onClick={onReview}
      className={cn(
        "atelier-unlocks-trigger relative min-h-11 gap-1.5 px-3 text-[12px] font-semibold",
        changeAnimating && "atelier-unlocks-trigger--changed",
      )}
      aria-label={t("businessPage.paidVariants.unlocks.title")}
    >
      <LockOpen className="size-4" strokeWidth={1.8} aria-hidden />
      <span>{t("businessPage.paidVariants.unlocks.triggerLabel")}</span>
      <span className="inline-flex min-w-4 justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
        {props.entries.length}
      </span>
    </Button>
  );

  if (onReview) return trigger;

  return (
    <Dialog
      open={trayOpen}
      onOpenChange={(open) => {
        if (!interactionBlocked) {
          setTrayOpen(open);
          props.onOpenChange?.(open);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="website-atelier atelier-unlock-tray-dialog gap-0 p-0">
        <DialogHeader className="atelier-unlock-tray-header gap-0 pr-12 text-left">
          <div className="atelier-unlock-popover-heading">
            <DialogTitle>
              <span key={props.entries.length} className="atelier-unlock-value-update">
                {t("businessPage.paidVariants.unlocks.dialogTitle", {
                  count: props.entries.length,
                })}
              </span>
            </DialogTitle>
          </div>
          <DialogDescription className="atelier-unlock-popover-hint text-pretty">
            {t("businessPage.paidVariants.unlocks.popoverHint")}
          </DialogDescription>
        </DialogHeader>
        <UnlockList
          {...props}
          showHeading={false}
          grouped
          className="atelier-unlock-popover-list"
        />
      </DialogContent>
    </Dialog>
  );
}

/** Purchase-mode body for the workspace-owned shared review dialog. */
export function PendingUnlocksReview(props: PendingUnlocksProps) {
  return (
    <UnlockList
      {...props}
      showHeading={false}
      grouped
      className="atelier-shared-purchase-review p-0 pt-6"
    />
  );
}

function UnlockList({
  entries,
  isLoading,
  isBlocked = false,
  checkoutRequiresSave = false,
  checkoutRetrySave = false,
  isSavingBeforeCheckout = false,
  checkoutDisabled = false,
  checkoutDisabledReason = null,
  onRemove,
  onClear,
  onCheckout,
  showHeading = true,
  grouped = false,
  bare = false,
  className,
}: UnlockListProps & { bare?: boolean }) {
  const { t } = useTranslation("website");
  const checkoutNoteId = useId();
  const { formatPrice } = useFormatPrice();
  const interactionBlocked = isLoading || isBlocked;
  const queueMutationBlocked = interactionBlocked || isSavingBeforeCheckout;
  const mountedRef = useRef(true);
  const [removingKeys, setRemovingKeys] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

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
  const entryGroups = grouped
    ? [
        {
          key: "styles",
          label: t("businessPage.paidVariants.unlocks.sectionStyles"),
          entries: entries.filter((entry) => entry.kind === "section" || entry.kind === "variant"),
        },
        {
          key: "brand",
          label: t("businessPage.paidVariants.unlocks.brandKit"),
          entries: entries.filter((entry) => entry.kind === "color" || entry.kind === "font"),
        },
      ].filter((group) => group.entries.length > 0)
    : [{ key: "all", label: null, entries }];
  const removalInProgress = removingKeys.size > 0;
  const checkoutNote = hasMixedCurrencies
    ? t("businessPage.paidVariants.unlocks.mixedCurrency")
    : checkoutDisabledReason
      ? checkoutDisabledReason
      : isSavingBeforeCheckout
        ? t("businessPage.paidVariants.unlocks.saveAndCheckoutHint")
        : checkoutRetrySave
          ? t("businessPage.paidVariants.unlocks.saveFailed")
          : checkoutRequiresSave
            ? t("businessPage.paidVariants.unlocks.saveAndCheckoutHint")
            : null;
  const checkoutNoteTone = hasMixedCurrencies || checkoutDisabledReason
    ? "warning"
    : checkoutRetrySave && !isSavingBeforeCheckout
      ? "error"
      : "neutral";

  const removeWithAnimation = (entry: UnlockLineItem) => {
    if (queueMutationBlocked || removingKeys.has(entry.key)) return;
    setRemovingKeys((current) => new Set(current).add(entry.key));
    const removalDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    window.setTimeout(() => {
      onRemove(entry);
      if (!mountedRef.current) return;
      setRemovingKeys((current) => {
        const next = new Set(current);
        next.delete(entry.key);
        return next;
      });
    }, removalDelay);
  };

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
            disabled={queueMutationBlocked}
            className="min-h-11 shrink-0 px-2 text-[12px] font-medium text-foreground-3 outline-none transition-colors hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
          >
            {t("businessPage.paidVariants.unlocks.clear")}
          </button>
        </div>
      ) : null}

      <div className="atelier-unlock-scroll website-atelier-scrollbar" aria-live="polite">
        {entryGroups.map((group) => (
          <section
            key={group.key}
            className="atelier-unlock-group"
            aria-label={group.label ?? t("businessPage.paidVariants.unlocks.title")}
          >
            {group.label ? (
              <div className="atelier-unlock-group-heading">
                <span>{group.label}</span>
                <span className="tabular-nums">{group.entries.length}</span>
              </div>
            ) : null}
            <ul className={cn("atelier-unlock-lines", bare ? "max-h-40" : "max-h-52")}>
              {group.entries.map((entry) => {
                const kindLabel = t(
                  entry.kind === "section"
                    ? "businessPage.paidVariants.sectionEyebrow"
                    : entry.kind === "variant"
                      ? "businessPage.paidVariants.eyebrow"
                      : entry.kind === "color"
                        ? "businessPage.theme.accentColor"
                        : "businessPage.theme.fontLabel",
                );
                const removing = removingKeys.has(entry.key);

                return (
                  <li
                    key={entry.key}
                    className={cn(
                      "atelier-unlock-line",
                      removing && "atelier-unlock-line--removing",
                    )}
                  >
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
                      onClick={() => removeWithAnimation(entry)}
                      disabled={queueMutationBlocked || removing}
                      aria-label={t("businessPage.paidVariants.unlocks.removeAria", { name: entry.name })}
                      className="website-atelier-focus atelier-unlock-remove relative grid size-7 shrink-0 place-items-center rounded-full text-[var(--atelier-muted-soft)] outline-none transition-colors hover:bg-[var(--atelier-field)] hover:text-[var(--atelier-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="size-3" strokeWidth={1.9} aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="atelier-unlock-summary border-t border-[var(--atelier-border-soft)] pt-3">
        {checkoutNote ? (
          <p
            id={checkoutNoteId}
            className={cn(
              "mb-2 text-pretty text-xs leading-5",
              checkoutNoteTone === "warning"
                ? "text-warning"
                : checkoutNoteTone === "error"
                  ? "text-destructive"
                  : "text-[var(--atelier-ink-soft)]",
            )}
            role={checkoutNoteTone === "error" ? "alert" : "status"}
          >
            {checkoutNote}
          </p>
        ) : null}
        <div className="atelier-unlock-total flex items-baseline justify-between gap-3 px-0.5">
          <p>{totalLabel}</p>
          <p className="text-[16px] font-semibold tabular-nums text-[var(--atelier-ink)]">
            <span key={total} className="atelier-unlock-value-update">{total}</span>
          </p>
        </div>
        <Button
          type="button"
          disabled={
            interactionBlocked ||
            removalInProgress ||
            isSavingBeforeCheckout ||
            checkoutDisabled ||
            hasMixedCurrencies
          }
          aria-describedby={checkoutNote ? checkoutNoteId : undefined}
          aria-busy={isLoading || isSavingBeforeCheckout}
          onClick={onCheckout}
          className="atelier-unlock-checkout relative mt-3 w-full before:absolute before:-inset-y-[3px] before:inset-x-0 before:content-['']"
        >
          {isSavingBeforeCheckout ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" color="white" aria-hidden />
              {t("page.status.saving")}
            </span>
          ) : isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" color="white" aria-hidden />
              {t("businessPage.paidVariants.processing")}
            </span>
          ) : (
            <span key={`${entries.length}-${total}`} className="atelier-unlock-value-update">
              {t(
                checkoutRetrySave
                  ? "businessPage.paidVariants.unlocks.retrySaveAndCompleteWithTotal"
                  : checkoutRequiresSave
                    ? "businessPage.paidVariants.unlocks.saveAndCompleteWithTotal"
                    : "businessPage.paidVariants.unlocks.completeWithTotal",
                {
                  count: entries.length,
                  total,
                },
              )}
            </span>
          )}
        </Button>
        <p className="atelier-unlock-secure-note">
          {t("businessPage.paidVariants.unlocks.secureNote")}
        </p>
      </div>
    </div>
  );
}

/** Compact composition specimen matching the artifact's preview language. Catalog line items do
 * not include thumbnail geometry, so the two real unlock kinds use distinct, deterministic
 * schematics instead of unrelated generic icons. */
export function UnlockSpecimen({ entry }: { entry: UnlockLineItem }) {
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
