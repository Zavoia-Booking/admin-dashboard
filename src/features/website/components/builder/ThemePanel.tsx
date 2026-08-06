import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronRight, Lock, RotateCcw, X } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../shared/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "../../../../shared/components/ui/radio-group";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../../../shared/components/ui/drawer";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../../shared/components/ui/sheet";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import type { WebsiteThemeAssetCatalogItem } from "../../types";
import { FONT_CATALOG, FONT_OPTIONS, type FontOption } from "./theme";

interface ThemePanelProps {
  fontKey: string;
  onFontChange: (key: string) => void;
  disabled?: boolean;
  /** The Atelier shell uses one quiet typeface row, with choices in a popover. */
  variant?: "default" | "atelier";
  /** At Atelier's 920px compact boundary, the typeface list becomes a bottom surface. */
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
  /** Effective preview font. It may differ from the persisted draft for a locked selection. */
  effectiveFontKey?: string;
  /** Routes every authoritative Atelier choice through the workspace ownership flow. */
  onThemeAssetSelect?: (asset: WebsiteThemeAssetCatalogItem) => void;
  /** Structured draft blocker for the persisted font key. */
  error?: string | null;
}

interface AtelierFontChoice {
  option: FontOption;
  asset?: WebsiteThemeAssetCatalogItem;
}

interface PickerFontLink {
  element: HTMLLinkElement;
  references: number;
}

const pickerFontLinks = new Map<string, PickerFontLink>();

function acquirePickerFontStylesheet(stylesheetUrl: string): void {
  const current = pickerFontLinks.get(stylesheetUrl);
  if (current) {
    current.references += 1;
    return;
  }
  const element = document.createElement("link");
  element.rel = "stylesheet";
  element.href = stylesheetUrl;
  element.dataset.websiteAtelierFontPicker = "true";
  document.head.appendChild(element);
  pickerFontLinks.set(stylesheetUrl, { element, references: 1 });
}

function releasePickerFontStylesheet(stylesheetUrl: string): void {
  const current = pickerFontLinks.get(stylesheetUrl);
  if (!current) return;
  current.references -= 1;
  if (current.references > 0) return;
  current.element.remove();
  pickerFontLinks.delete(stylesheetUrl);
}

/** The font half of the brand theme (brand colour lives in the Branding form — one colour source). A brand
 *  band group: live "Aa" specimens in a row, the active one inked, the rest receded. Radiogroup semantics
 *  with roving tabindex — one Tab stop, arrows move (and apply) the selection, like the colour swatches. */
export function ThemePanel({
  fontKey,
  onFontChange,
  disabled = false,
  variant = "default",
  compact = false,
  themeAssets,
  catalogReady,
  catalogError,
  onRetryCatalog,
  premiumSelectionReady = true,
  effectiveFontKey,
  onThemeAssetSelect,
  error,
}: ThemePanelProps) {
  const { t } = useTranslation("website");
  const isMobile = useIsMobile();
  const [atelierPickerOpen, setAtelierPickerOpen] = useState(false);
  const [atelierAnnouncement, setAtelierAnnouncement] = useState("");
  const atelierTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [atelierPopoverAlignOffset, setAtelierPopoverAlignOffset] = useState(0);
  const fontGroupId = useId();
  const errorId = "font-control-error";
  const errorMessage = error ? (
    <p
      id={errorId}
      className="flex items-start gap-1.5 text-[11px] leading-[1.45] text-destructive"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-3 shrink-0" strokeWidth={1.9} aria-hidden />
      <span>{error}</span>
    </p>
  ) : null;
  const usesAuthoritativeCatalog =
    variant === "atelier" &&
    (themeAssets !== undefined ||
      catalogReady !== undefined ||
      catalogError !== undefined ||
      onRetryCatalog !== undefined ||
      effectiveFontKey !== undefined ||
      onThemeAssetSelect !== undefined);

  useEffect(() => {
    if (variant !== "atelier" || !atelierPickerOpen) return;
    const visibleFontKeys = usesAuthoritativeCatalog
      ? catalogReady === true
        ? new Set(
            (themeAssets ?? [])
              .filter((asset) => asset.kind === "font")
              .flatMap((asset) => [asset.assetKey, asset.value]),
          )
        : new Set<string>()
      : new Set(FONT_OPTIONS.map((font) => font.key));
    const stylesheetUrls = [
      ...new Set(
        FONT_CATALOG.filter((font) => visibleFontKeys.has(font.key)).flatMap((font) =>
          font.loading.source === "google-fonts" ? [font.loading.stylesheetUrl] : [],
        ),
      ),
    ];
    stylesheetUrls.forEach(acquirePickerFontStylesheet);
    return () => stylesheetUrls.forEach(releasePickerFontStylesheet);
  }, [atelierPickerOpen, catalogReady, themeAssets, usesAuthoritativeCatalog, variant]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const current = FONT_OPTIONS.findIndex((f) => f.key === fontKey);
    let next: number;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = FONT_OPTIONS.length - 1;
    else {
      const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      next = ((current < 0 ? 0 : current) + delta + FONT_OPTIONS.length) % FONT_OPTIONS.length;
    }
    const target = FONT_OPTIONS[next];
    if (!target) return;
    onFontChange(target.key);
    e.currentTarget
      .querySelector<HTMLButtonElement>(`[data-font-option="${target.key}"]`)
      ?.focus();
  };

  const activeFontKey = effectiveFontKey ?? fontKey;
  const activeFont =
    (variant === "atelier" ? FONT_CATALOG : FONT_OPTIONS).find(
      (font) => font.key === activeFontKey,
    ) ?? FONT_OPTIONS[0];

  if (variant === "atelier") {
    const catalogIsReady = usesAuthoritativeCatalog ? catalogReady === true : true;
    const atelierLabel = t("businessPage.theme.assetStatus.typefacePickerLabel");
    const fontAssets = (themeAssets ?? []).filter((asset) => asset.kind === "font");
    const fontChoices: AtelierFontChoice[] = usesAuthoritativeCatalog
      ? catalogIsReady
        ? FONT_CATALOG.map((option) => ({
            option,
            asset: fontAssets.find(
              (asset) => asset.assetKey === option.key && asset.value === option.key,
            ),
          }))
            .filter(
              (choice): choice is AtelierFontChoice & { asset: WebsiteThemeAssetCatalogItem } =>
                choice.asset !== undefined,
            )
            .sort((left, right) => left.asset.sortOrder - right.asset.sortOrder)
        : []
      : FONT_OPTIONS.map((option) => ({ option }));
    const sansChoices = fontChoices.filter((choice) => choice.option.category === "sans");
    const serifChoices = fontChoices.filter((choice) => choice.option.category === "serif");
    const hasPremiumChoices = fontChoices.some(
      (choice) => usesAuthoritativeCatalog && choice.asset?.isIncluded === false,
    );
    const orderedChoices = [...sansChoices, ...serifChoices];
    const activeChoice = orderedChoices.find((choice) => choice.option.key === activeFontKey);

    const localizedName = (choice: AtelierFontChoice) =>
      t(choice.option.labelKey, { defaultValue: choice.asset?.name ?? choice.option.name });
    const isLocked = (choice: AtelierFontChoice | undefined) =>
      !!choice?.asset && !choice.asset.isIncluded && !choice.asset.owned;
    const isPreviewing = (choice: AtelierFontChoice | undefined) =>
      !!choice &&
      choice.option.key === activeFontKey &&
      isLocked(choice) &&
      activeFontKey !== fontKey;
    const canSelect = (choice: AtelierFontChoice) =>
      !disabled &&
      (usesAuthoritativeCatalog
        ? catalogIsReady &&
          !!choice.asset &&
          (choice.asset.available || choice.asset.owned) &&
          (!isLocked(choice) || premiumSelectionReady) &&
          !!onThemeAssetSelect
        : true);
    const statusFor = (choice: AtelierFontChoice | undefined) => {
      if (!catalogIsReady) return t("businessPage.theme.assetStatus.checking");
      if (!choice) return t("businessPage.theme.assetStatus.unavailable");
      if (!usesAuthoritativeCatalog || choice.asset?.isIncluded) {
        return t("businessPage.paidVariants.includedBadge");
      }
      if (choice.asset?.owned) return t("businessPage.theme.assetStatus.premiumOwned");
      if (!choice.asset?.available) return t("businessPage.theme.assetStatus.unavailable");
      // Theme assets are never priced (all colors/fonts ship free) — no price strings here.
      return t("businessPage.theme.assetStatus.premiumUnlockOnce");
    };
    const activeStatus = statusFor(activeChoice);
    const activeLocked = isLocked(activeChoice);
    const activePreviewing = isPreviewing(activeChoice);
    const activeName = activeChoice ? localizedName(activeChoice) : t(activeFont.labelKey);

    const selectChoice = (choice: AtelierFontChoice) => {
      if (!canSelect(choice)) return;
      const replacingPreview = orderedChoices.some(
        (candidate) => candidate !== choice && isPreviewing(candidate),
      );
      const clearingPreview = !isLocked(choice) && orderedChoices.some(isPreviewing);

      if (usesAuthoritativeCatalog) {
        if (!choice.asset) return;
        onThemeAssetSelect?.(choice.asset);
      } else {
        onFontChange(choice.option.key);
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

    const renderFontChoice = (choice: AtelierFontChoice) => {
      const { option, asset } = choice;
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
      const tag = asset?.isIncluded
        ? null
        : owned
          ? t("businessPage.theme.assetStatus.ownedShort")
          : asset?.available
            ? null
            : t("businessPage.theme.assetStatus.unavailable");

      return (
        <RadioGroupItem
          key={option.key}
          value={option.key}
          aria-label={accessibleLabel}
          title={accessibleLabel}
          data-font-option={option.key}
          data-locked={locked || undefined}
          data-owned={owned || undefined}
          data-previewing={previewing || undefined}
          disabled={!selectable}
          className={cn(
            "atelier-brand-font-option website-atelier-focus website-atelier-press",
            !selectable && "cursor-not-allowed opacity-55",
          )}
        >
          <span
            className="atelier-brand-font-name"
            style={{ fontFamily: option.stack, fontWeight: option.weight }}
          >
            {name}
          </span>
          {(tag || locked) && (
            <span className="atelier-brand-font-status" aria-hidden>
              {locked && <Lock strokeWidth={2.2} />}
              {tag && (
                <span className={owned ? "atelier-brand-font-owned" : "atelier-brand-font-price"}>
                  {tag}
                </span>
              )}
            </span>
          )}
        </RadioGroupItem>
      );
    };

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
        aria-label={atelierLabel}
        aria-busy={!catalogIsReady}
        className="atelier-brand-font-options block gap-0"
      >
        {sansChoices.length > 0 && (
          <div
            role="group"
            aria-labelledby={`${fontGroupId}-sans`}
            className="atelier-brand-font-group atelier-brand-font-group--sans"
          >
            <p id={`${fontGroupId}-sans`} className="atelier-brand-options-label">
              {t("businessPage.theme.assetStatus.sans")}
            </p>
            <div className="atelier-brand-font-list">{sansChoices.map(renderFontChoice)}</div>
          </div>
        )}
        {serifChoices.length > 0 && (
          <div
            role="group"
            aria-labelledby={`${fontGroupId}-serif`}
            className="atelier-brand-font-group atelier-brand-font-group--serif"
          >
            <p id={`${fontGroupId}-serif`} className="atelier-brand-options-label">
              {t("businessPage.theme.assetStatus.serif")}
            </p>
            <div className="atelier-brand-font-list">{serifChoices.map(renderFontChoice)}</div>
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
        id="font-control"
        ref={atelierTriggerRef}
        type="button"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        aria-label={t("businessPage.theme.assetStatus.triggerAria", {
          label: atelierLabel,
          name: activeName,
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
          error && "!border-destructive bg-error-bg",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          className="atelier-brand-control-type"
          style={{ fontFamily: activeFont.stack, fontWeight: activeFont.weight }}
          aria-hidden
        >
          Aa
        </span>
        <span className="atelier-brand-control-copy">
          <span className="atelier-brand-control-name">{activeName}</span>
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
        <div className="space-y-1.5">
          {isMobile ? (
            <Drawer
              open={atelierPickerOpen}
              onOpenChange={handleAtelierPickerOpenChange}
              autoFocus
              handleOnly
              repositionInputs={false}
            >
              <DrawerTrigger asChild>{trigger}</DrawerTrigger>
              <DrawerContent
                onOpenAutoFocus={handlePickerOpenAutoFocus}
                overlayClassName="!z-[70] bg-black/40"
                className="website-atelier atelier-brand-drawer !z-[71] !max-h-[84dvh] overflow-hidden rounded-t-[18px] border-x-0 border-b-0 border-[var(--atelier-border)] !bg-[var(--atelier-canvas)] px-[18px] pb-[calc(1.875rem+env(safe-area-inset-bottom))] text-[var(--atelier-ink)] outline-none"
              >
                <DrawerHeader className="mb-4 shrink-0 p-0 pt-4 !text-left">
                  <DrawerTitle className="text-left text-[16px] tracking-[-0.01em]">
                    {atelierLabel}
                  </DrawerTitle>
                  <DrawerDescription className="sr-only">
                    {atelierLabel}
                  </DrawerDescription>
                </DrawerHeader>
                <div
                  data-vaul-no-drag=""
                  className="atelier-brand-picker-scroll website-atelier-scrollbar"
                >
                  {pickerOptions}
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Sheet open={atelierPickerOpen} onOpenChange={handleAtelierPickerOpenChange}>
              <SheetTrigger asChild>{trigger}</SheetTrigger>
              <SheetContent
                side="bottom"
                onOpenAutoFocus={handlePickerOpenAutoFocus}
                portalContainer={
                  typeof document === "undefined"
                    ? null
                    : document.getElementById("website-builder-main")
                }
                overlayClassName="!absolute z-50 bg-black/40"
                showCloseButton={false}
                className="website-atelier atelier-brand-drawer z-50 !absolute !flex !max-h-[84dvh] flex-col overflow-hidden rounded-t-[18px] border-x-0 border-b-0 border-[var(--atelier-border)] bg-[var(--atelier-canvas)] px-[18px] pb-[calc(1.875rem+env(safe-area-inset-bottom))] pt-4 text-[var(--atelier-ink)]"
              >
                <SheetHeader className="mb-4 flex-row items-center justify-between gap-3 p-0 text-left">
                  <SheetTitle className="text-[16px] tracking-[-0.01em]">
                    {atelierLabel}
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    {atelierLabel}
                  </SheetDescription>
                  <SheetClose
                    aria-label={t("common:aria.close")}
                    className="atelier-drawer-close website-atelier-focus website-atelier-press"
                  >
                    <X className="size-[15px]" strokeWidth={2} aria-hidden />
                  </SheetClose>
                </SheetHeader>
                <div className="atelier-brand-picker-scroll website-atelier-scrollbar">
                  {pickerOptions}
                </div>
              </SheetContent>
            </Sheet>
          )}
          {errorMessage}
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
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
            className="website-atelier atelier-brand-popover atelier-brand-popover--font z-50 flex max-h-[calc(100dvh-130px)] w-[min(278px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[14px] border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] p-[13px] text-[var(--atelier-ink)]"
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
            <div className="atelier-brand-picker-scroll atelier-brand-picker-scroll--font website-atelier-scrollbar">
              {pickerOptions}
            </div>
            {hasPremiumChoices && (
              <div className="atelier-brand-popover-footer">
                <Lock strokeWidth={2.2} aria-hidden />
                <span>{t("businessPage.theme.assetStatus.premiumUnlockOnce")}</span>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {errorMessage}
      </div>
    );
  }

  return (
    <div
      id="font-control"
      tabIndex={-1}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
      className="space-y-2.5 outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span id="website-font-group-label" className="text-[11px] font-semibold uppercase text-foreground-3">
        {t("businessPage.theme.fontLabel")}
      </span>
      <div className="rounded-xl border border-border bg-surface p-1">
        <div
          role="radiogroup"
          aria-labelledby="website-font-group-label"
          onKeyDown={handleKeyDown}
          className="grid grid-cols-2 gap-1 sm:grid-cols-4"
        >
          {FONT_OPTIONS.map((f, i) => {
            const active = fontKey === f.key;
            const hasSelection = FONT_OPTIONS.some((o) => o.key === fontKey);
            const tabbable = active || (!hasSelection && i === 0);
            return (
              <button
                key={f.key}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={tabbable ? 0 : -1}
                data-font-option={f.key}
                onClick={() => onFontChange(f.key)}
                disabled={disabled}
                className={cn(
                  "group/font relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center outline-none transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50",
                  disabled && "cursor-not-allowed opacity-60",
                  active
                    ? "border-primary/35 bg-primary/[0.055] dark:bg-primary/[0.10]"
                    : "border-transparent bg-transparent hover:border-border hover:bg-surface-hover/70",
                )}
              >
                <span className="shrink-0 text-[21px] leading-none text-foreground-1" style={{ fontFamily: f.stack }}>
                  Aa
                </span>
                <span
                  className={cn(
                    "max-w-full truncate text-[11px] leading-none transition-colors duration-150 ease-out",
                    active ? "font-medium text-primary-700 dark:text-primary-400" : "text-foreground-3",
                  )}
                >
                  {t(f.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {errorMessage}
    </div>
  );
}

export default ThemePanel;
