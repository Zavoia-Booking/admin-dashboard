import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  RotateCcw,
  X,
} from "lucide-react";
import type { Business, WebsiteThemeAssetCatalogItem } from "../types";
import { cn } from "../../../shared/lib/utils";
import { useFormatPrice } from "../../../shared/hooks/useFormatPrice";
import { Button } from "../../../shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../shared/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "../../../shared/components/ui/radio-group";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../shared/components/ui/sheet";
import {
  BRAND_ACCENT_CATALOG,
  BRAND_ACCENTS,
  displayFontFor,
  safeBrandColor,
  type BrandAccentOption,
} from "./builder/theme";

// Shared micro-label for each brand group (mirrors the section-list mono labels).
const GROUP_LABEL = "text-[11px] font-semibold uppercase text-foreground-3";

// The inline row (outside the popover) stays to a calm 8 spanning the palette's whole warm→cool→neutral
// arc (a plain first-8 slice would read all-warm); the popover is the overflow surface for the full set.
const INLINE_ACCENT_KEYS = new Set(["burgundy", "terracotta", "amber", "olive", "teal", "navy", "plum", "ink"]);
const INLINE_ACCENTS = BRAND_ACCENTS.filter((a) => INLINE_ACCENT_KEYS.has(a.key));

interface BrandingSectionProps {
  business: Business | null;
  pageName: string;
  /** Active display face — the lockup renders the page name in it so brand choices resolve live. */
  fontKey: string;
}

interface BrandColorControlProps {
  canWrite: boolean;
  brandColorHex: string;
  setBrandColorHex: (value: string) => void;
  /** The Atelier workspace uses a compact row and keeps the complete palette in the popover. */
  variant?: "default" | "atelier";
  /** At Atelier's 920px compact boundary, the palette becomes a bottom drawer. */
  compact?: boolean;
  /** Authoritative Website catalog entries. Only Atelier consumes paid theme assets. */
  themeAssets?: WebsiteThemeAssetCatalogItem[];
  /** True only after the authoritative catalog request has completed successfully. */
  catalogReady?: boolean;
  /** Initial catalog failures render a local recovery action inside the open picker. */
  catalogError?: string | null;
  onRetryCatalog?: () => void;
  /** Locked paid choices are selectable only while pricing/ownership is freshly authoritative. */
  premiumSelectionReady?: boolean;
  /** Effective preview color. It may differ from the persisted draft for a locked selection. */
  effectiveBrandColorHex?: string;
  /** Routes every authoritative Atelier choice through the workspace ownership flow. */
  onThemeAssetSelect?: (asset: WebsiteThemeAssetCatalogItem) => void;
}

interface AtelierAccentChoice {
  option: BrandAccentOption;
  asset?: WebsiteThemeAssetCatalogItem;
}

/**
 * Canonical identity context for the Website draft. The Website Builder intentionally does not
 * mutate a Business name/logo/contact record; the established Account profile owns those edits.
 */
export function BrandingSection({
  business,
  pageName,
  fontKey,
}: BrandingSectionProps) {
  const { t } = useTranslation("website");

  // The lockup renders the page name in the active display face (same stack the public page uses).
  const font = displayFontFor(fontKey);

  return (
    <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface shadow-xs dark:bg-neutral-900">
        {business?.logo ? (
          <img src={business.logo} alt="" loading="eager" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <Building2 className="size-6 text-foreground-3" aria-hidden />
        )}
      </div>

      <div className="min-w-0">
        <span className={GROUP_LABEL}>{t("page.identity.title")}</span>
        {/* Type specimen, not a heading — capped below the module title so a heavy display
            face never out-ranks the page hierarchy. */}
        <div
          key={font.key}
          className="mt-1.5 truncate text-[19px] leading-[1.08] text-foreground-1 sm:text-[20px]"
          style={{ fontFamily: font.stack, fontWeight: font.weight, letterSpacing: font.tracking }}
        >
          {pageName}
        </div>
        <Link
          to="/account?tab=profile"
          className="mt-2 inline-flex min-h-9 items-center gap-1 text-[12px] font-medium text-primary outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-focus"
        >
          {t("page.identity.edit")}
          <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function BrandColorControl({
  canWrite,
  brandColorHex,
  setBrandColorHex,
  variant = "default",
  compact = false,
  themeAssets,
  catalogReady,
  catalogError,
  onRetryCatalog,
  premiumSelectionReady = true,
  effectiveBrandColorHex,
  onThemeAssetSelect,
}: BrandColorControlProps) {
  const { t } = useTranslation("website");
  const { formatPrice } = useFormatPrice();
  const [atelierPickerOpen, setAtelierPickerOpen] = useState(false);
  const [atelierAnnouncement, setAtelierAnnouncement] = useState("");
  const atelierTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [atelierPopoverAlignOffset, setAtelierPopoverAlignOffset] = useState(0);
  const accentGroupId = useId();
  const persistedAccent = safeBrandColor(brandColorHex).toLowerCase();
  const effectiveAccentHex = safeBrandColor(effectiveBrandColorHex ?? brandColorHex);
  const activeAccent = effectiveAccentHex.toLowerCase();
  const accentHex = effectiveAccentHex;
  const activeAccentEntry = BRAND_ACCENT_CATALOG.find((a) => a.hex.toLowerCase() === activeAccent);
  const activeAccentName = activeAccentEntry
    ? t(`businessPage.branding.brandColor.swatches.${activeAccentEntry.key}`)
    : accentHex.toUpperCase();

  const renderSwatch = (
    { key, hex }: { key: string; hex: string },
    index: number,
    group: Array<{ key: string; hex: string }>,
  ) => {
    const selected = activeAccent === hex.toLowerCase();
    const name = t(`businessPage.branding.brandColor.swatches.${key}`);
    // Roving tabindex: one tab stop per radiogroup — the selection, or the first swatch when
    // the active color isn't in this group (custom hex).
    const groupHasSelection = group.some((a) => a.hex.toLowerCase() === activeAccent);
    const tabbable = selected || (!groupHasSelection && index === 0);
    return (
      <button
        key={key}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={name}
        title={name}
        data-swatch={key}
        tabIndex={tabbable ? 0 : -1}
        disabled={!canWrite}
        onClick={() => setBrandColorHex(hex)}
        style={{ backgroundColor: hex }}
        className={cn(
          "relative size-6 rounded-full outline-none transition-transform duration-150 ease-out",
          "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
          canWrite ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-not-allowed opacity-60",
          selected
            ? "scale-105 ring-2 ring-foreground-1 ring-offset-2 ring-offset-popover"
            : "ring-1 ring-inset ring-black/10 dark:ring-white/20",
        )}
      >
        {/* 32px hit target around the 24px visual — no layout change, no neighbor overlap. */}
        <span className="absolute -inset-1" aria-hidden />
        {selected && (
          <span className="absolute inset-0 grid place-items-center" aria-hidden>
            <Check className="size-3.5 text-white" strokeWidth={2.4} />
          </span>
        )}
      </button>
    );
  };

  // Standard radio-group keyboard behavior: arrows move the selection within the group.
  const handleSwatchKeyDown =
    (group: Array<{ key: string; hex: string }>) => (event: KeyboardEvent<HTMLDivElement>) => {
      if (!canWrite) return;
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
      if (!forward && !backward) return;
      event.preventDefault();
      const current = group.findIndex((a) => a.hex.toLowerCase() === activeAccent);
      const next =
        current < 0
          ? group[forward ? 0 : group.length - 1]
          : group[(current + (forward ? 1 : -1) + group.length) % group.length];
      setBrandColorHex(next.hex);
      event.currentTarget.querySelector<HTMLButtonElement>(`[data-swatch="${next.key}"]`)?.focus();
    };

  if (variant === "atelier") {
    const usesAuthoritativeCatalog =
      themeAssets !== undefined ||
      catalogReady !== undefined ||
      catalogError !== undefined ||
      onRetryCatalog !== undefined ||
      effectiveBrandColorHex !== undefined ||
      onThemeAssetSelect !== undefined;
    const catalogIsReady = usesAuthoritativeCatalog ? catalogReady === true : true;
    const atelierLabel = t("businessPage.theme.assetStatus.accentPickerLabel");
    const colorAssets = (themeAssets ?? []).filter((asset) => asset.kind === "color");
    const accentChoices: AtelierAccentChoice[] = usesAuthoritativeCatalog
      ? catalogIsReady
        ? BRAND_ACCENT_CATALOG.map((option) => ({
            option,
            asset: colorAssets.find(
              (asset) =>
                asset.assetKey === option.key &&
                asset.value.toLowerCase() === option.hex.toLowerCase(),
            ),
          }))
            .filter(
              (choice): choice is AtelierAccentChoice & { asset: WebsiteThemeAssetCatalogItem } =>
                choice.asset !== undefined,
            )
            .sort((left, right) => left.asset.sortOrder - right.asset.sortOrder)
        : []
      : BRAND_ACCENTS.map((option) => ({ option }));
    const includedChoices = accentChoices.filter((choice) =>
      usesAuthoritativeCatalog ? choice.asset?.isIncluded === true : true,
    );
    const premiumChoices = accentChoices.filter(
      (choice) => usesAuthoritativeCatalog && choice.asset?.isIncluded === false,
    );
    const orderedChoices = [...includedChoices, ...premiumChoices];
    const hexFor = (choice: AtelierAccentChoice) =>
      safeBrandColor(
        usesAuthoritativeCatalog && choice.asset ? choice.asset.value : choice.option.hex,
      );
    const activeChoice = orderedChoices.find(
      (choice) => hexFor(choice).toLowerCase() === activeAccent,
    );

    const localizedName = (choice: AtelierAccentChoice) =>
      t(`businessPage.branding.brandColor.swatches.${choice.option.key}`, {
        defaultValue: choice.asset?.name ?? choice.option.name,
      });
    const isLocked = (choice: AtelierAccentChoice | undefined) =>
      !!choice?.asset && !choice.asset.isIncluded && !choice.asset.owned;
    const isPreviewing = (choice: AtelierAccentChoice | undefined) =>
      !!choice &&
      hexFor(choice).toLowerCase() === activeAccent &&
      isLocked(choice) &&
      activeAccent !== persistedAccent;
    const canSelect = (choice: AtelierAccentChoice) =>
      canWrite &&
      (usesAuthoritativeCatalog
        ? catalogIsReady &&
          !!choice.asset &&
          (choice.asset.available || choice.asset.owned) &&
          (!isLocked(choice) || premiumSelectionReady) &&
          !!onThemeAssetSelect
        : true);
    const statusFor = (choice: AtelierAccentChoice | undefined) => {
      if (!catalogIsReady) return t("businessPage.theme.assetStatus.checking");
      if (!choice) return t("businessPage.theme.assetStatus.unavailable");
      if (!usesAuthoritativeCatalog || choice.asset?.isIncluded) {
        return t("businessPage.paidVariants.includedBadge");
      }
      if (choice.asset?.owned) return t("businessPage.theme.assetStatus.premiumOwned");
      if (!choice.asset?.available) return t("businessPage.theme.assetStatus.unavailable");
      return t("businessPage.theme.assetStatus.premiumPrice", {
        price: formatPrice(choice.asset.priceMinor, choice.asset.currency),
      });
    };
    const activeStatus = statusFor(activeChoice);
    const atelierActiveName = activeChoice ? localizedName(activeChoice) : activeAccentName;
    const activeLocked = isLocked(activeChoice);
    const activePreviewing = isPreviewing(activeChoice);

    const selectChoice = (choice: AtelierAccentChoice) => {
      if (!canSelect(choice)) return;
      const replacingPreview = orderedChoices.some(
        (candidate) => candidate !== choice && isPreviewing(candidate),
      );
      const clearingPreview = !isLocked(choice) && orderedChoices.some(isPreviewing);

      if (usesAuthoritativeCatalog) {
        if (!choice.asset) return;
        onThemeAssetSelect?.(choice.asset);
      } else {
        setBrandColorHex(choice.option.hex);
      }

      const name = localizedName(choice);
      if (isLocked(choice)) {
        setAtelierAnnouncement(
          t(
            replacingPreview
              ? "businessPage.theme.assetStatus.previewReplaced"
              : "businessPage.theme.assetStatus.previewAnnounced",
            { name },
          ),
        );
      } else {
        setAtelierAnnouncement(
          t(
            clearingPreview
              ? "businessPage.theme.assetStatus.previewCleared"
              : "businessPage.theme.assetStatus.selectionApplied",
            { name },
          ),
        );
      }
    };

    const renderAtelierSwatch = (choice: AtelierAccentChoice) => {
      const { option, asset } = choice;
      const swatchHex = hexFor(choice);
      const locked = isLocked(choice);
      const previewing = isPreviewing(choice);
      const owned = !!asset && !asset.isIncluded && asset.owned;
      const selectable = canSelect(choice);
      const name = localizedName(choice);
      const status = statusFor(choice);
      const accessibleLabel = t(
        previewing
          ? "businessPage.theme.assetStatus.optionPreviewingAria"
          : "businessPage.theme.assetStatus.optionAria",
        { name, status },
      );

      return (
        <RadioGroupItem
          key={option.key}
          value={option.key}
          aria-label={accessibleLabel}
          title={accessibleLabel}
          data-theme-asset-option={option.key}
          data-locked={locked || undefined}
          data-owned={owned || undefined}
          data-previewing={previewing || undefined}
          disabled={!selectable}
          style={{ "--atelier-swatch": swatchHex } as CSSProperties}
          className={cn(
            "atelier-brand-swatch-option website-atelier-focus website-atelier-press",
            selectable ? "cursor-pointer" : "cursor-not-allowed opacity-55",
          )}
        >
          <span className="atelier-brand-swatch-disc" style={{ backgroundColor: swatchHex }} aria-hidden>
            {locked && (
              <span className="atelier-brand-swatch-lock">
                <Lock strokeWidth={2.6} />
              </span>
            )}
          </span>
          <span className="atelier-brand-swatch-name">{name}</span>
        </RadioGroupItem>
      );
    };

    const uniformPremiumAsset = premiumChoices[0]?.asset;
    const hasUniformPremiumPrice =
      !!uniformPremiumAsset &&
      premiumChoices.every(
        (choice) =>
          choice.asset?.priceMinor === uniformPremiumAsset.priceMinor &&
          choice.asset.currency.toLowerCase() === uniformPremiumAsset.currency.toLowerCase(),
      );
    const premiumHeading = hasUniformPremiumPrice
      ? t("businessPage.theme.assetStatus.premiumEach", {
          price: formatPrice(uniformPremiumAsset.priceMinor, uniformPremiumAsset.currency),
        })
      : t("businessPage.theme.assetStatus.premiumUnlockOnce");

    const pickerOptions = !catalogIsReady && catalogError ? (
      <div className="atelier-brand-picker-error" role="alert">
        <AlertTriangle aria-hidden />
        <p>{t("page.publishReview.catalogErrorDescription")}</p>
        {onRetryCatalog ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetryCatalog}>
            <RotateCcw aria-hidden />
            {t("page.publishReview.retryCatalog")}
          </Button>
        ) : null}
      </div>
    ) : !catalogIsReady ? (
      <p className="atelier-brand-picker-state" role="status">
        {t("businessPage.theme.assetStatus.checking")}
      </p>
    ) : orderedChoices.length === 0 ? (
      <p className="atelier-brand-picker-state" role="status">
        {t("businessPage.theme.assetStatus.empty")}
      </p>
    ) : (
      <RadioGroup
        value={activeChoice?.option.key ?? ""}
        onValueChange={(key) => {
          const choice = orderedChoices.find((candidate) => candidate.option.key === key);
          if (choice) selectChoice(choice);
        }}
        aria-label={t("businessPage.branding.brandColor.allSwatches")}
        aria-busy={!catalogIsReady}
        className="atelier-brand-accent-options block gap-0"
      >
        {includedChoices.length > 0 && (
          <div
            role="group"
            aria-labelledby={`${accentGroupId}-included`}
            className="atelier-brand-option-group atelier-brand-option-group--included"
          >
            <p id={`${accentGroupId}-included`} className="atelier-brand-options-label">
              {t("businessPage.paidVariants.includedBadge")}
            </p>
            <div className="atelier-brand-swatch-grid">{includedChoices.map(renderAtelierSwatch)}</div>
          </div>
        )}
        {premiumChoices.length > 0 && (
          <div
            role="group"
            aria-labelledby={`${accentGroupId}-premium`}
            className="atelier-brand-option-group atelier-brand-option-group--premium"
          >
            <p id={`${accentGroupId}-premium`} className="atelier-brand-options-label atelier-brand-options-label--locked">
              <Lock strokeWidth={2.2} aria-hidden />
              <span>{premiumHeading}</span>
            </p>
            <div className="atelier-brand-swatch-grid">{premiumChoices.map(renderAtelierSwatch)}</div>
          </div>
        )}
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {atelierAnnouncement}
        </span>
      </RadioGroup>
    );

    const handleAtelierPickerOpenChange = (open: boolean) => {
      if (open && !compact) {
        const triggerTop = atelierTriggerRef.current?.getBoundingClientRect().top;
        const builderBodyTop = document
          .querySelector<HTMLElement>("#website-builder-main .website-atelier-body")
          ?.getBoundingClientRect().top;
        if (triggerTop != null && builderBodyTop != null) {
          setAtelierPopoverAlignOffset(builderBodyTop + 56 - triggerTop);
        }
      }
      setAtelierPickerOpen(open);
    };
    const handlePickerOpenAutoFocus = (event: Event) => {
      const selected = (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(
        '[role="radio"][tabindex="0"]:not(:disabled)',
      );
      if (!selected) return;
      event.preventDefault();
      selected.focus();
    };
    const trigger = (
      <button
        ref={atelierTriggerRef}
        type="button"
        disabled={!canWrite}
        aria-label={t("businessPage.theme.assetStatus.triggerAria", {
          label: atelierLabel,
          name: atelierActiveName,
          status: activeStatus,
        })}
        data-locked={activeLocked || undefined}
        data-previewing={activePreviewing || undefined}
        data-owned={
          (!!activeChoice?.asset &&
            !activeChoice.asset.isIncluded &&
            activeChoice.asset.owned) ||
          undefined
        }
        className={cn(
          "group/brand-control atelier-brand-control website-atelier-focus website-atelier-press",
          !canWrite && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          className="atelier-brand-control-swatch"
          style={{ backgroundColor: accentHex }}
          aria-hidden
        />
        <span className="atelier-brand-control-copy">
          <span className="atelier-brand-control-name">{atelierActiveName}</span>
          <span className="atelier-brand-control-meta">
            {activeLocked && <Lock className="atelier-brand-control-lock" strokeWidth={2.4} aria-hidden />}
            <span>{activeStatus}</span>
          </span>
        </span>
        <ChevronRight
          className="atelier-brand-control-chevron transition-transform duration-150 group-data-[state=open]/brand-control:rotate-90"
          strokeWidth={1.8}
          aria-hidden
        />
      </button>
    );

    if (compact) {
      return (
        <Sheet open={atelierPickerOpen} onOpenChange={handleAtelierPickerOpenChange}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent
            side="bottom"
            onOpenAutoFocus={handlePickerOpenAutoFocus}
            portalContainer={typeof document === "undefined" ? null : document.getElementById("website-builder-main")}
            overlayClassName="!absolute z-50 bg-black/40"
            showCloseButton={false}
            className="website-atelier atelier-brand-drawer z-50 !absolute !flex !max-h-[84dvh] flex-col overflow-hidden rounded-t-[18px] border-x-0 border-b-0 border-[var(--atelier-border)] bg-[var(--atelier-canvas)] px-[18px] pb-[calc(1.875rem+env(safe-area-inset-bottom))] pt-2 text-[var(--atelier-ink)] data-[state=closed]:duration-200 data-[state=open]:duration-200"
          >
            <span className="atelier-sheet-grab" aria-hidden />
            <SheetHeader className="mb-4 flex-row items-center justify-between gap-3 p-0 text-left">
              <SheetTitle className="text-[16px] tracking-[-0.01em]">
                {atelierLabel}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {t("businessPage.branding.brandColor.allSwatches")}
              </SheetDescription>
              <SheetClose
                aria-label={t("common:aria.close")}
                className="atelier-drawer-close website-atelier-focus website-atelier-press"
              >
                <X className="size-[15px]" strokeWidth={2} aria-hidden />
              </SheetClose>
            </SheetHeader>
            <div className="atelier-brand-picker-scroll website-atelier-scrollbar">{pickerOptions}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Popover open={atelierPickerOpen} onOpenChange={handleAtelierPickerOpenChange}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent
          side="right"
          onOpenAutoFocus={handlePickerOpenAutoFocus}
          align="start"
          alignOffset={atelierPopoverAlignOffset}
          sideOffset={28}
          collisionPadding={12}
          className="website-atelier atelier-brand-popover atelier-brand-popover--accent z-50 flex max-h-[calc(100dvh-130px)] w-[min(302px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[14px] border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] p-[13px] text-[var(--atelier-ink)]"
        >
          <div className="atelier-brand-popover-header">
            <h3>{atelierLabel}</h3>
            <button
              type="button"
              onClick={() => setAtelierPickerOpen(false)}
              aria-label={t("common:close")}
              className="atelier-brand-popover-close website-atelier-focus website-atelier-press"
            >
              <X className="size-[11px]" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="atelier-brand-picker-scroll website-atelier-scrollbar">{pickerOptions}</div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className={GROUP_LABEL}>{t("businessPage.branding.brandColor.label")}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!canWrite}
              aria-label={t("businessPage.branding.brandColor.label")}
              className={cn(
                "group/accent inline-flex min-h-11 max-w-[190px] items-center gap-2 rounded-full border border-border bg-surface px-2.5 text-left outline-none transition-[transform,border-color,background-color] duration-150 ease-out xl:h-8 xl:min-h-0",
                "hover:border-border-strong hover:bg-surface-hover active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <span
                className="size-4 shrink-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: accentHex }}
                aria-hidden
              />
              <span className="min-w-0 truncate text-[12px] font-medium text-foreground-1">{activeAccentName}</span>
              <ChevronDown
                className="size-3.5 shrink-0 text-foreground-3 transition-transform duration-150 ease-out group-data-[state=open]/accent:rotate-180"
                strokeWidth={1.8}
                aria-hidden
              />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(336px,calc(100vw-2rem))] p-4">
            <div
              role="radiogroup"
              aria-label={t("businessPage.branding.brandColor.allSwatches")}
              className="grid grid-cols-8 gap-2.5"
              onKeyDown={handleSwatchKeyDown(BRAND_ACCENTS)}
            >
              {BRAND_ACCENTS.map(renderSwatch)}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div
        role="radiogroup"
        aria-label={t("businessPage.branding.brandColor.label")}
        className="flex flex-wrap gap-2"
        onKeyDown={handleSwatchKeyDown(INLINE_ACCENTS)}
      >
        {INLINE_ACCENTS.map(renderSwatch)}
      </div>
    </div>
  );
}

export default BrandingSection;
