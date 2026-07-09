import { useMemo, type KeyboardEvent } from "react";
import { Check, Lock, ShoppingCart, Sparkles } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import type { SectionEntry, WebsiteVariantCatalogEntry } from "../../../types";
import type { SectionVariant } from "./sectionCatalog";
import { ScaledPreview } from "./preview/ScaledPreview";
import type { PreviewData } from "./preview/shared/types";

/** House ease-out (mirrors --ease-out-strong in globals.css). */
export const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";

export type MarketplaceT = (key: string, options?: Record<string, unknown>) => string;

export interface SectionStyleOption {
  variant: SectionVariant;
  catalogEntry?: WebsiteVariantCatalogEntry;
  paid: boolean;
  locked: boolean;
  owned: boolean;
  inCart: boolean;
  priceLabel: string | null;
}

/** Stand-in for SectionStylePicker while the catalog is still loading — the active variant's real
 *  entitlement (owned/locked/price) isn't known yet, so no badge is shown at all rather than a
 *  momentarily-wrong one. Mirrors the gallery's own card shape so loading → loaded never jumps. */
export function VariantPickerSkeleton() {
  return (
    <div className="mb-3 animate-pulse rounded-xl border border-border bg-surface px-3 py-3" aria-hidden>
      <div className="h-3 w-24 rounded-full bg-surface-hover" />
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="aspect-[16/10] rounded-lg border border-border-subtle bg-surface-hover/60" />
        ))}
      </div>
    </div>
  );
}

/**
 * Visual variant gallery: each option is a live, scaled-down render of the section in that style
 * (a real thumbnail, not a text pill) so the owner sees exactly what publishing it looks like. A
 * horizontal snap strip on narrow containers (editor column, phones), a calm 2-up grid from `@md`
 * up — keyed off the picker's own container width, not the viewport, so it reads right whether it's
 * shown full-width or squeezed beside the brand panel.
 */
export function SectionStylePicker({
  entry,
  variants,
  selectedVariantId,
  disabled,
  onSelect,
  t,
  isNative,
  previewData,
  previewNumber,
}: {
  entry: SectionEntry;
  variants: SectionStyleOption[];
  selectedVariantId: string;
  disabled: boolean;
  onSelect: (option: SectionStyleOption) => void;
  t: MarketplaceT;
  isNative?: boolean;
  previewData: PreviewData;
  previewNumber: number;
}) {
  // Roving tabindex: one tab stop (the selected option), arrows move focus. Manual activation —
  // arrow keys deliberately don't select, because selecting a locked option routes to the
  // purchase dialog; Enter/Space (the button's native activation) commits.
  const activeIndex = variants.findIndex((o) => o.variant.id === selectedVariantId);
  const tabStopIndex = activeIndex >= 0 ? activeIndex : 0;
  const handleRadioKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const radios = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'),
    );
    if (radios.length === 0) return;
    e.preventDefault();
    const current = radios.indexOf(document.activeElement as HTMLButtonElement);
    // Above the @md container breakpoint the strip becomes a real 2-up grid — there Up/Down must
    // step a visual row (one column-count), not act as Left/Right aliases. Read the layout from
    // computed style so the container query stays the single source of truth.
    const style = window.getComputedStyle(e.currentTarget);
    const cols = style.display === "grid" ? style.gridTemplateColumns.split(" ").length : 1;
    let next: number;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = radios.length - 1;
    else if (current === -1) next = 0;
    else if (cols > 1 && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      next = current + (e.key === "ArrowDown" ? cols : -cols);
      if (next < 0 || next >= radios.length) return; // vertical steps don't wrap
    } else {
      next =
        (current + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + radios.length) %
        radios.length;
    }
    radios[next]?.focus();
  };

  return (
    <div className="@container/picker mb-3 rounded-xl border border-border bg-surface px-3 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-3">
            {t("businessPage.builder.variantLabel")}
          </span>
          <p className="mt-1 text-[12px] leading-5 text-foreground-3">
            {/* Store policy: the web helper mentions buying — native gets the web-dashboard hint instead. */}
            {isNative
              ? t("businessPage.paidVariants.nativeHint")
              : t("businessPage.paidVariants.styleHelper")}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-2.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1",
          "@md/picker:grid @md/picker:grid-cols-2 @md/picker:snap-none @md/picker:overflow-visible @md/picker:pb-0",
        )}
        role="radiogroup"
        onKeyDown={handleRadioKeyDown}
      >
        {variants.map((option, i) => (
          <VariantOptionCard
            key={option.variant.id}
            sectionType={entry.type}
            option={option}
            active={selectedVariantId === option.variant.id}
            previewOnly={selectedVariantId === option.variant.id && entry.variant !== option.variant.id && option.locked}
            tabStop={i === tabStopIndex}
            disabled={disabled}
            onSelect={onSelect}
            t={t}
            isNative={isNative}
            previewData={previewData}
            previewNumber={previewNumber}
            staggerIndex={i}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * One gallery option. `layout` is memoized off `sectionType`/`variantId` alone (both primitive
 * strings, stable across re-renders) rather than built inline in the parent's `.map()` — a fresh
 * array literal there would defeat `ScaledPreview`'s underlying `memo(LivePreview)` on every
 * keystroke in the editor, re-rendering every visible thumbnail for no reason.
 */
function VariantOptionCard({
  sectionType,
  option,
  active,
  previewOnly,
  tabStop,
  disabled,
  onSelect,
  t,
  isNative,
  previewData,
  previewNumber,
  staggerIndex,
}: {
  sectionType: string;
  option: SectionStyleOption;
  active: boolean;
  previewOnly: boolean;
  tabStop: boolean;
  disabled: boolean;
  onSelect: (option: SectionStyleOption) => void;
  t: MarketplaceT;
  isNative?: boolean;
  previewData: PreviewData;
  previewNumber: number;
  staggerIndex: number;
}) {
  const { variant } = option;
  const layout = useMemo(
    () => [{ type: sectionType, variant: variant.id, visible: true }],
    [sectionType, variant.id],
  );
  const badge = !isNative && option.inCart
    ? t("businessPage.paidVariants.inCartBadge")
    : option.locked
      ? previewOnly
        ? t("businessPage.paidVariants.previewBadge")
        : (isNative ? null : option.priceLabel) ?? t("businessPage.paidVariants.lockedBadge")
      : option.owned
        ? t("businessPage.paidVariants.ownedBadge")
        : t("businessPage.paidVariants.includedBadge");

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={tabStop ? 0 : -1}
      disabled={disabled}
      onClick={() => onSelect(option)}
      aria-label={
        option.locked
          ? isNative
            ? t("businessPage.paidVariants.lockedAriaNative", { name: t(variant.labelKey) })
            : option.priceLabel
              ? t("businessPage.paidVariants.lockedAria", { name: t(variant.labelKey), price: option.priceLabel })
              : t(variant.labelKey)
          : t(variant.labelKey)
      }
      title={
        option.locked
          ? isNative
            ? t("businessPage.paidVariants.nativeHint")
            : option.priceLabel
              ? option.inCart
                ? t("businessPage.paidVariants.inCartTitle", { price: option.priceLabel })
                : t("businessPage.paidVariants.lockedTitle", { price: option.priceLabel })
              : undefined
          : option.owned
            ? t("businessPage.paidVariants.ownedTitle")
            : undefined
      }
      style={{ animationDelay: `${staggerIndex * 50}ms` }}
      className={cn(
        "group w-[85%] shrink-0 snap-start rounded-lg border p-1.5 text-left outline-none",
        "@md/picker:w-auto @md/picker:shrink",
        "transition-[transform,border-color,background-color,box-shadow] duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "motion-safe:fill-mode-backwards motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300",
        EASE,
        active
          ? "border-border-strong bg-surface shadow-xs"
          : "border-border bg-background hover:border-border-strong hover:bg-surface-hover/45",
      )}
    >
      <ScaledPreview
        layout={layout}
        data={previewData}
        chrome={false}
        startNumber={previewNumber}
        fadeOverflow
        className={cn(
          "aspect-[16/10] rounded-md border border-border bg-background",
          active && "ring-1 ring-inset ring-foreground-1/15",
        )}
      />
      <span className="mt-2 flex items-center justify-between gap-2 px-0.5">
        <span className="min-w-0 truncate text-[12.5px] font-semibold text-foreground-1">
          {t(variant.labelKey)}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {active ? (
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground-1 text-surface">
              <Check className="size-3" strokeWidth={2.4} aria-hidden />
            </span>
          ) : !isNative && option.inCart ? (
            <ShoppingCart className="size-4 shrink-0 text-primary" strokeWidth={1.9} aria-hidden />
          ) : option.locked ? (
            <Lock className="size-4 shrink-0 text-foreground-3" strokeWidth={1.9} aria-hidden />
          ) : option.owned ? (
            <Sparkles className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
          ) : null}
          <span
            className={cn(
              "inline-flex max-w-[92px] items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              option.locked || option.inCart
                ? "border-border bg-surface-hover/70 text-foreground-2"
                : option.owned
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border-subtle bg-transparent text-foreground-3",
            )}
          >
            <span className="truncate">{badge}</span>
          </span>
        </span>
      </span>
    </button>
  );
}

export default SectionStylePicker;
