import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Check, Lock, LockOpen, Sparkles } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import type { SectionEntry, WebsiteVariantCatalogEntry } from "../../types";
import type { SectionVariant } from "./sectionCatalog";
import { ScaledPreview } from "./preview/ScaledPreview";
import type { PreviewData } from "./preview/shared/types";

/** House ease-out (mirrors --ease-out-strong in globals.css). */
export const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";

export type WebsiteT = (key: string, options?: Record<string, unknown>) => string;

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
 * (a real thumbnail, not a text pill) so the owner sees exactly how it looks in the draft preview. A
 * horizontal snap strip on narrow containers (editor column, phones), a calm 2-up grid from `@md`
 * up — keyed off the picker's own container width, not the viewport, so it reads right whether it's
 * shown full-width or squeezed beside the brand panel.
 */
export function SectionStylePicker({
  entry,
  variants,
  selectedVariantId,
  previewOnlyVariantId,
  disabled,
  isOptionDisabled,
  onSelect,
  t,
  isNative,
  previewData,
  previewNumber,
  presentation = "default",
}: {
  entry: SectionEntry;
  variants: SectionStyleOption[];
  selectedVariantId: string;
  /** Exact locked selection rendered locally without changing the saved draft. */
  previewOnlyVariantId?: string;
  disabled: boolean;
  /** Granular capability gate. Read-only users may still preview locked styles while
   * included/owned choices remain non-mutating. */
  isOptionDisabled?: (option: SectionStyleOption) => boolean;
  onSelect: (option: SectionStyleOption) => void;
  t: WebsiteT;
  isNative?: boolean;
  previewData: PreviewData;
  previewNumber: number;
  /** The Atelier desktop inspector uses a compact two-up gallery in its 332px rail. */
  presentation?: "default" | "atelier";
}) {
  // Roving tabindex: one tab stop (the selected option), arrows move focus. Manual activation —
  // arrow keys deliberately don't select, because selecting a locked option routes to the
  // purchase dialog; Enter/Space (the button's native activation) commits.
  const activeIndex = variants.findIndex((o) => o.variant.id === selectedVariantId);
  const activeDisabled =
    activeIndex >= 0 && (disabled || !!isOptionDisabled?.(variants[activeIndex]));
  const firstEnabledIndex = variants.findIndex(
    (option) => !disabled && !isOptionDisabled?.(option),
  );
  const tabStopIndex =
    activeIndex >= 0 && !activeDisabled
      ? activeIndex
      : firstEnabledIndex >= 0
        ? firstEnabledIndex
        : 0;
  const [railPosition, setRailPosition] = useState(tabStopIndex);
  const visibleRailPosition = Math.min(railPosition, Math.max(0, variants.length - 1));
  const isAtelier = presentation === "atelier";
  const includedCount = variants.filter((option) => !option.paid).length;
  const premiumCount = variants.length - includedCount;
  const selectedDescriptionKey = `businessPage.sections.variantDescriptions.${entry.type}.${selectedVariantId}`;
  const selectedVariant = variants.find((option) => option.variant.id === selectedVariantId)?.variant;
  const optionsRef = useRef<HTMLDivElement | null>(null);

  // The compact Atelier gallery is a horizontal rail. When a sheet opens—or a choice changes—keep
  // the selected card in the first readable position without moving the surrounding sheet itself.
  useEffect(() => {
    if (!isAtelier) return;
    const container = optionsRef.current;
    const selected = container?.querySelector<HTMLButtonElement>('[role="radio"][aria-checked="true"]');
    if (!container || !selected) return;
    const styles = window.getComputedStyle(container);
    if (styles.display === "grid") return;

    const containerRect = container.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    const inset = Number.parseFloat(styles.paddingLeft) || 0;
    const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const left = container.scrollLeft + selectedRect.left - containerRect.left - inset;
    container.scrollTo({ left: Math.min(maxLeft, Math.max(0, left)), behavior: "auto" });
  }, [isAtelier, selectedVariantId, variants.length]);

  const updateRailPosition = (container: HTMLDivElement) => {
    if (window.getComputedStyle(container).display === "grid") return;
    const cards = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    if (cards.length === 0) return;

    const center = container.scrollLeft + container.clientWidth / 2;
    let next = 0;
    let distance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const nextDistance = Math.abs(cardCenter - center);
      if (nextDistance < distance) {
        next = index;
        distance = nextDistance;
      }
    });
    setRailPosition((current) => (current === next ? current : next));
  };

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
    <div
      className={cn(
        "@container/picker mb-3 rounded-xl border border-border bg-surface px-3 py-3",
        isAtelier && "atelier-style-picker rounded-none border-0 bg-transparent px-0 py-0",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between",
          isAtelier && "atelier-style-heading mb-2",
        )}
      >
        <div>
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-3",
              isAtelier && "font-mono text-[10px] font-medium tracking-[0.12em]",
            )}
          >
            {isAtelier ? t("businessPage.builder.atelierStyleLabel") : t("businessPage.builder.variantLabel")}
          </span>
          {!isAtelier ? <p className="mt-1 text-[12px] leading-5 text-foreground-3">
            {/* Store policy: the web helper mentions buying — native gets the web-dashboard hint instead. */}
            {isNative
              ? t("businessPage.paidVariants.nativeHint")
              : t("businessPage.paidVariants.styleHelper")}
          </p> : null}
        </div>
        {isAtelier ? (
          <span className="atelier-style-count font-mono text-[10px] text-foreground-3" aria-hidden>
            {t("businessPage.builder.atelierStyleCount", {
              included: includedCount,
              premium: premiumCount,
            })}
          </span>
        ) : null}
      </div>

      <div
        ref={optionsRef}
        className={cn(
          "mt-2.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1",
          isAtelier
            ? "atelier-style-options mt-0 grid grid-cols-2 gap-[9px] overflow-visible pb-0"
            : "@md/picker:grid @md/picker:grid-cols-2 @md/picker:snap-none @md/picker:overflow-visible @md/picker:pb-0",
        )}
        role="radiogroup"
        onKeyDown={handleRadioKeyDown}
        onScroll={isAtelier ? undefined : (event) => updateRailPosition(event.currentTarget)}
        onClick={isAtelier ? undefined : (event) => {
          const card = (event.target as HTMLElement).closest<HTMLButtonElement>('[role="radio"]');
          if (!card) return;
          const cards = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
          const next = cards.indexOf(card);
          if (next >= 0) setRailPosition(next);
        }}
      >
        {variants.map((option, i) => (
          <VariantOptionCard
            key={option.variant.id}
            sectionType={entry.type}
            option={option}
            active={selectedVariantId === option.variant.id}
            current={entry.variant === option.variant.id}
            previewOnly={previewOnlyVariantId === option.variant.id && option.locked}
            tabStop={i === tabStopIndex}
            disabled={disabled || !!isOptionDisabled?.(option)}
            onSelect={onSelect}
            t={t}
            isNative={isNative}
            previewData={previewData}
            previewNumber={previewNumber}
            staggerIndex={i}
            presentation={presentation}
          />
        ))}
      </div>
      {isAtelier ? (
        <p
          key={selectedVariantId}
          className="atelier-style-description mt-2 px-1 text-[11px] leading-[1.5] text-foreground-3"
        >
          {selectedVariant ? `${t(selectedVariant.labelKey)} — ` : ""}
          {t(selectedDescriptionKey)}
        </p>
      ) : variants.length > 1 ? (
        <div className="mt-2 flex items-center justify-between @md/picker:hidden">
          <span className="sr-only" aria-live="polite">
            {t("businessPage.builder.stylePosition", {
              current: visibleRailPosition + 1,
              total: variants.length,
            })}
          </span>
          <span className="flex items-center gap-1.5" aria-hidden>
            {variants.map((option, index) => (
              <span
                key={option.variant.id}
                className={cn(
                  "size-1.5 rounded-full transition-[background-color,transform] duration-150",
                  index === visibleRailPosition ? "scale-110 bg-foreground-1" : "bg-border-strong/50",
                )}
              />
            ))}
          </span>
          <span className="text-[11px] font-medium tabular-nums text-foreground-3" aria-hidden>
            {visibleRailPosition + 1}/{variants.length}
          </span>
        </div>
      ) : null}
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
  current,
  previewOnly,
  tabStop,
  disabled,
  onSelect,
  t,
  isNative,
  previewData,
  previewNumber,
  staggerIndex,
  presentation = "default",
}: {
  sectionType: string;
  option: SectionStyleOption;
  active: boolean;
  current: boolean;
  previewOnly: boolean;
  tabStop: boolean;
  disabled: boolean;
  onSelect: (option: SectionStyleOption) => void;
  t: WebsiteT;
  isNative?: boolean;
  previewData: PreviewData;
  previewNumber: number;
  staggerIndex: number;
  presentation?: "default" | "atelier";
}) {
  const { variant } = option;
  const isAtelier = presentation === "atelier";
  const layout = useMemo(
    () => [{ type: sectionType, variant: variant.id, visible: true }],
    [sectionType, variant.id],
  );
  const badge = isAtelier
    ? previewOnly
      ? t("businessPage.paidVariants.previewBadge")
      : option.locked
        ? (isNative ? null : option.priceLabel) ?? t("businessPage.paidVariants.lockedBadge")
        : current
          ? t("businessPage.paidVariants.currentBadge")
          : option.owned
            ? t("businessPage.paidVariants.ownedBadge")
            : t("businessPage.paidVariants.includedBadge")
    : !isNative && option.inCart
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
      data-section-variant={variant.id}
      aria-checked={active}
      tabIndex={tabStop ? 0 : -1}
      disabled={disabled}
      onClick={() => onSelect(option)}
      aria-label={
        isAtelier
          ? badge
            ? `${t(variant.labelKey)}, ${badge}`
            : t(variant.labelKey)
          : option.locked
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
              ? !isAtelier && option.inCart
                ? t("businessPage.paidVariants.inCartTitle", { price: option.priceLabel })
                : t("businessPage.paidVariants.lockedTitle", { price: option.priceLabel })
              : undefined
          : option.owned
            ? t("businessPage.paidVariants.ownedTitle")
            : undefined
      }
      style={isAtelier ? undefined : { animationDelay: `${staggerIndex * 50}ms` }}
      className={cn(
        "group w-[calc(100%-0.75rem)] shrink-0 snap-start rounded-lg border p-1.5 text-left outline-none",
        isAtelier ? "atelier-variant-option w-auto shrink rounded-[12px] border-border-subtle bg-surface p-[7px]" : "@md/picker:w-auto @md/picker:shrink",
        "transition-[transform,border-color,background-color,box-shadow] duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        isAtelier && current && active && "atelier-variant-option--current",
        isAtelier && previewOnly && "atelier-variant-option--previewing",
        !isAtelier && "motion-safe:fill-mode-backwards motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200",
        EASE,
        !isAtelier && (
          active
            ? "border-border-strong bg-surface shadow-xs"
            : "border-border bg-background hover:border-border-strong hover:bg-surface-hover/45"
        ),
      )}
    >
      {isAtelier ? (
        <AtelierStyleThumbnail
          sectionType={sectionType}
          variantId={variant.id}
          accent={previewData.brandColor}
          locked={option.locked}
        />
      ) : (
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
      )}
      <span className="atelier-variant-caption mt-2 flex items-center justify-between gap-2 px-0.5">
        <span className="atelier-variant-label min-w-0 truncate text-[12.5px] font-semibold text-foreground-1">
          {t(variant.labelKey)}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {!isAtelier && !isNative && option.inCart ? (
            <LockOpen className="size-4 shrink-0 text-primary" strokeWidth={1.9} aria-hidden />
          ) : !isAtelier && option.locked ? (
            <Lock className="size-4 shrink-0 text-foreground-3" strokeWidth={1.9} aria-hidden />
          ) : active && !isAtelier ? (
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground-1 text-surface">
              <Check className="size-3" strokeWidth={2.4} aria-hidden />
            </span>
          ) : !isAtelier && option.owned ? (
            <Sparkles className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
          ) : null}
          <span
            className={cn(
              "inline-flex max-w-[92px] items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              isAtelier && "atelier-variant-tag",
              isAtelier && current && "atelier-variant-tag-current",
              isAtelier && previewOnly && "atelier-variant-tag-previewing",
              isAtelier && option.owned && !current && "atelier-variant-tag-owned",
              isAtelier && option.locked && !previewOnly && "atelier-variant-tag-price",
              option.locked || option.inCart
                ? "border-border bg-surface-hover/70 text-foreground-2"
                : option.owned
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border-subtle bg-transparent text-foreground-3",
            )}
          >
            <span key={badge ?? "none"} className="atelier-variant-tag-text truncate">{badge}</span>
          </span>
        </span>
      </span>
    </button>
  );
}

const wireframePatternFor = (sectionType: string, variantId: string) => {
  if (["cards", "wall", "grid", "bento", "portraits", "masonry"].includes(variantId)) {
    return variantId === "masonry" ? "masonry" : "tiles";
  }
  if (["carousel", "deck", "spotlight"].includes(variantId)) return "focus";
  if (["accordion", "list", "index", "ledger", "roster", "mega"].includes(variantId)) return "lines";
  if (["scroll", "loop", "marquee"].includes(variantId) || sectionType === "marquee") return "band";
  if (["manifesto", "poster", "minimal", "hairline", "bar"].includes(variantId)) return "type";
  return "split";
};

type AtelierWireKind = "s" | "t" | "l" | "a" | "i" | "g";
type AtelierWireBlock = readonly [
  x: number,
  y: number,
  width: number,
  height: number,
  kind: AtelierWireKind,
  radius?: number,
  rotate?: number,
];

const wire = (...blocks: AtelierWireBlock[]) => blocks;

/** Production-owned copy of the 64×44 compositions for implemented variants. */
const ATELIER_WIREFRAMES: Readonly<Record<string, readonly AtelierWireBlock[]>> = {
  "nav:default": wire([3, 3, 10, 3, "t"], [26, 4, 14, 1.5, "l"], [52, 2, 9, 4, "a", 2], [4, 13, 56, 24, "s", 2]),
  "nav:editorial": wire([3, 3, 10, 3, "t"], [26, 4, 14, 1.5, "l"], [52, 2, 9, 4, "a", 2], [4, 13, 56, 24, "s", 2]),
  "nav:capsule": wire([14, 2, 36, 6, "s", 3], [17, 4, 6, 2, "t"], [40, 3, 8, 4, "a", 3], [4, 14, 56, 23, "s", 2]),
  "nav:split": wire([4, 3, 12, 2, "l"], [27, 2, 10, 3, "t"], [48, 3, 12, 2, "l"], [4, 13, 56, 24, "s", 2]),
  "nav:underlay": wire([3, 3, 9, 3, "t"], [54, 2, 7, 5, "i", 1], [4, 13, 42, 24, "s", 2], [50, 13, 10, 24, "a", 2]),
  "hero:default": wire([0, 0, 64, 44, "a"], [6, 23, 31, 16, "s", 2], [10, 27, 19, 3, "t"], [10, 33, 13, 2, "l"], [10, 36, 8, 2.5, "a", 3]),
  "hero:cinematic": wire([0, 0, 64, 44, "s"], [4, 29, 27, 4, "t"], [4, 36, 18, 2, "l"], [25, 35, 8, 3, "a", 3]),
  "hero:poster": wire([0, 0, 64, 44, "i"], [18, 30, 28, 14, "g"], [12, 12, 40, 7, "t"], [16, 21, 32, 7, "t"], [26, 33, 12, 3, "a", 2]),
  "hero:portal": wire([0, 0, 64, 44, "i"], [18, 8, 28, 28, "g"], [22, 5, 20, 29, "s", 10], [24, 37, 16, 3, "t"]),
  "hero:drift": wire([0, 0, 64, 44, "i"], [8, 9, 48, 26, "g"], [10, 17, 44, 5, "t"], [16, 25, 32, 5, "t"], [26, 34, 12, 3, "a", 2]),
  "hero:tumble": wire([6, 14, 6, 8, "t", 1, -8], [15, 12, 6, 9, "t", 1, 6], [24, 15, 6, 8, "t", 1, -4], [33, 13, 6, 9, "t", 1, 9], [42, 15, 6, 8, "t", 1, -7], [51, 14, 6, 8, "t", 1, 5], [6, 34, 20, 2, "l"], [30, 33, 10, 3, "a", 3]),
  "announcement:bar": wire([0, 2, 64, 6, "a"], [6, 4, 26, 2, "t"], [48, 4, 10, 2, "t"], [4, 14, 56, 24, "s", 2]),
  "announcement:split": wire([0, 2, 64, 6, "a"], [2, 4, 10, 2, "t"], [16, 4, 10, 2, "t"], [30, 4, 10, 2, "t"], [44, 4, 10, 2, "t"], [4, 14, 56, 24, "s", 2]),
  "announcement:hairline": wire([14, 2, 36, 6, "a", 3], [18, 4, 20, 2, "t"], [4, 14, 56, 24, "s", 2]),
  "marquee:scroll": wire([0, 10, 64, 22, "i"], [3, 18, 13, 4, "t"], [20, 18, 11, 4, "l"], [35, 18, 16, 4, "t"], [56, 19, 4, 4, "a", 4]),
  "marquee:loop": wire([-4, 9, 72, 24, "i"], [0, 17, 12, 4, "t"], [16, 17, 4, 4, "a", 4], [24, 17, 14, 4, "l"], [43, 17, 4, 4, "a", 4], [51, 17, 15, 4, "t"]),
  "about:manifesto": wire([0, 0, 64, 44, "i"], [13, 8, 38, 2, "l"], [8, 14, 48, 5, "t"], [12, 21, 40, 5, "t"], [11, 32, 9, 6, "a", 1], [22, 32, 9, 6, "s", 1], [33, 32, 9, 6, "s", 1], [44, 32, 9, 6, "s", 1]),
  "about:editorial": wire([4, 5, 56, 1, "l"], [4, 9, 36, 7, "t"], [4, 19, 31, 6, "l"], [41, 19, 19, 6, "t"], [4, 28, 56, 8, "s", 2], [4, 39, 56, 1, "l"]),
  "about:sticky": wire([4, 7, 23, 9, "t"], [4, 20, 12, 2, "a"], [34, 6, 1, 31, "a"], [38, 8, 22, 4, "l"], [38, 17, 22, 4, "l"], [38, 26, 22, 8, "s", 2], [38, 37, 22, 1, "l"]),
  "services:feature": wire([4, 5, 25, 34, "s", 2], [7, 31, 13, 3, "t"], [7, 35, 8, 2, "a", 2], [34, 5, 18, 4, "t"], [34, 13, 26, 2, "l"], [34, 19, 26, 2, "l"], [34, 25, 26, 2, "l"], [34, 31, 26, 2, "l"], [56, 13, 4, 2, "a"]),
  "services:bento": wire([0, 0, 64, 44, "i"], [4, 5, 28, 5, "t"], [4, 14, 10, 7, "a", 1], [17, 15, 1, 5, "l"], [21, 15, 30, 4, "t"], [54, 15, 6, 4, "l"], [4, 24, 12, 8, "s", 1], [19, 26, 1, 5, "l"], [23, 26, 27, 4, "t"], [54, 26, 6, 4, "a"], [48, 37, 12, 3, "l"]),
  "services:grid": wire([4, 5, 26, 15, "s", 2], [7, 8, 13, 3, "t"], [7, 14, 20, 1.5, "l"], [34, 5, 26, 21, "s", 2], [37, 8, 14, 3, "t"], [37, 14, 20, 1.5, "l"], [37, 19, 20, 1.5, "l"], [4, 24, 26, 15, "s", 2], [7, 27, 12, 3, "t"], [7, 33, 20, 1.5, "l"], [34, 30, 26, 9, "s", 2]),
  "locations:showcase": wire([4, 6, 28, 4, "l"], [4, 12, 28, 4, "l"], [4, 18, 28, 4, "a"], [4, 25, 28, 12, "s"], [36, 6, 24, 31, "s", 2]),
  "locations:cards": wire([4, 6, 30, 20, "s", 2], [4, 28, 17, 5, "t"], [36, 6, 11, 9, "s", 2], [36, 17, 11, 7, "t"], [49, 6, 14, 17, "s", 2], [36, 26, 11, 7, "s", 2], [49, 25, 14, 8, "s", 2]),
  "locations:panorama": wire([0, 8, 64, 26, "s"], [6, 26, 16, 3, "t"], [50, 10, 8, 2, "a", 1]),
  "locations:atlas": wire([4, 5, 11, 3, "t"], [18, 5, 11, 3, "t"], [32, 5, 11, 3, "t"], [4, 11, 36, 26, "s", 2], [43, 11, 17, 26, "s"], [46, 15, 11, 2, "l"], [46, 21, 11, 2, "l"], [46, 27, 11, 2, "a"]),
  "gallery:carousel": wire([2, 10, 25, 24, "s", 2], [30, 10, 25, 24, "s", 2], [58, 10, 6, 24, "s", 2], [28, 38, 3, 2, "a", 2]),
  "gallery:masonry": wire([4, 6, 17, 20, "s", 2], [4, 28, 17, 10, "s", 2], [23, 6, 17, 12, "s", 2], [23, 20, 17, 18, "s", 2], [42, 6, 18, 24, "s", 2], [42, 32, 18, 6, "s", 2]),
  "gallery:bento": wire([4, 6, 20, 18, "s", 2], [26, 6, 16, 8, "s", 2], [26, 16, 16, 8, "s", 2], [44, 6, 16, 18, "s", 2], [4, 26, 38, 12, "s", 2], [44, 26, 16, 12, "s", 2]),
  "gallery:index": wire([1, 5, 13, 34, "s", 2], [16, 5, 23, 20, "s", 2], [16, 27, 23, 12, "s", 2], [41, 5, 10, 15, "s", 2], [53, 5, 10, 15, "s", 2], [41, 22, 22, 17, "s", 2]),
  "gallery:fan": wire([12, 10, 20, 26, "s", 2, -14], [22, 8, 20, 27, "s", 2, -2], [32, 10, 20, 26, "s", 2, 10]),
  "team:portraits": wire([4, 8, 17, 28, "s", 2], [23, 8, 17, 28, "s", 2], [42, 8, 17, 28, "s", 2]),
  "team:roster": wire([4, 7, 6, 6, "s", 3], [13, 8, 26, 3, "l"], [4, 18, 6, 6, "s", 3], [13, 19, 22, 3, "l"], [4, 29, 6, 6, "s", 3], [13, 30, 24, 3, "l"]),
  "team:columns": wire([4, 4, 7, 3, "a", 3], [13, 4, 9, 3, "s", 3], [24, 4, 9, 3, "s", 3], [4, 10, 26, 28, "s", 2], [7, 30, 12, 2.5, "t"], [7, 34, 8, 1.5, "l"], [33, 10, 8, 28, "s", 2], [43, 10, 8, 28, "s", 2], [53, 10, 8, 28, "s", 2]),
  "team:carousel": wire([4, 4, 7, 4, "t"], [14, 6, 46, 1, "l"], [2, 12, 9, 22, "s", 2], [15, 9, 22, 29, "s", 2], [18, 32, 11, 2.5, "t"], [40, 12, 15, 22, "s", 2], [58, 12, 4, 22, "s", 2], [29, 41, 4, 1.5, "a", 2]),
  "testimonials:default": wire([10, 10, 44, 5, "t"], [14, 19, 36, 3, "l"], [24, 30, 3, 3, "a", 3], [30, 30, 3, 3, "a", 3], [36, 30, 3, 3, "a", 3]),
  "testimonials:wall": wire([4, 6, 27, 15, "s", 2], [33, 6, 27, 15, "s", 2], [4, 23, 27, 15, "s", 2], [33, 23, 27, 15, "s", 2]),
  "testimonials:marquee": wire([2, 10, 18, 8, "s", 2], [24, 10, 22, 8, "s", 2], [50, 10, 14, 8, "s", 2], [-2, 26, 16, 8, "s", 2], [18, 26, 20, 8, "s", 2], [42, 26, 20, 8, "s", 2]),
  "testimonials:spotlight": wire([16, 8, 32, 26, "s", 2], [22, 14, 20, 2.5, "l"], [22, 20, 16, 2.5, "l"], [28, 38, 8, 2, "a", 1]),
  "testimonials:deck": wire([20, 14, 28, 22, "s", 2, 6], [17, 11, 28, 22, "s", 2, 2], [14, 9, 28, 22, "s", 2, -3]),
  "faq:grid": wire([4, 6, 27, 15, "s", 2], [33, 6, 27, 15, "s", 2], [4, 23, 27, 15, "s", 2], [33, 23, 27, 15, "s", 2]),
  "faq:accordion": wire([4, 7, 50, 3, "l"], [56, 7, 3, 3, "t"], [4, 15, 50, 3, "l"], [56, 15, 3, 3, "t"], [4, 23, 50, 3, "a"], [4, 30, 40, 2, "l"]),
  "faq:index": wire([4, 5, 35, 1.5, "a"], [4, 10, 31, 3, "t"], [36, 9, 4, 4, "a", 3], [4, 18, 28, 3, "l"], [36, 17, 4, 4, "s", 3], [4, 26, 32, 3, "l"], [36, 25, 4, 4, "s", 3], [45, 5, 14, 1.5, "a"], [45, 11, 15, 8, "l"], [45, 24, 5, 5, "s", 3], [52, 25, 8, 2, "t"]),
  "footer:editorial": wire([4, 6, 14, 2, "l"], [24, 6, 14, 2, "l"], [44, 6, 14, 2, "l"], [4, 26, 44, 10, "t"]),
  "footer:directory": wire([4, 6, 16, 3, "t"], [46, 6, 16, 2, "l"], [4, 13, 58, 1, "a"], [4, 20, 12, 2, "t"], [4, 25, 10, 1.5, "l"], [4, 29, 10, 1.5, "l"], [22, 20, 12, 2, "t"], [22, 25, 10, 1.5, "l"], [40, 20, 12, 2, "t"], [40, 25, 10, 1.5, "l"], [48, 32, 14, 4, "a", 3]),
  "footer:signature": wire([6, 7, 52, 12, "t"], [6, 22, 52, 1, "l"], [6, 28, 15, 2.5, "t"], [6, 33, 20, 2, "l"], [6, 38, 9, 3.5, "a"], [32, 28, 12, 2, "t"], [32, 33, 15, 1.5, "l"], [48, 28, 12, 2, "t"], [48, 33, 14, 1.5, "l"]),
  "footer:masthead": wire([4, 4, 0.5, 24, "l"], [18, 4, 0.5, 24, "l"], [32, 4, 0.5, 24, "l"], [46, 4, 0.5, 24, "l"], [6, 8, 7, 1.5, "a"], [20, 8, 7, 1.5, "a"], [34, 8, 7, 1.5, "a"], [48, 8, 7, 1.5, "a"], [6, 13, 9, 1, "l"], [6, 16, 7, 1, "l"], [20, 13, 8, 1, "l"], [20, 16, 6, 1, "l"], [34, 13, 9, 1, "l"], [34, 16, 7, 1, "l"], [34, 19, 8, 1, "l"], [48, 13, 11, 1, "l"], [48, 17, 11, 3, "a", 1], [2, 33, 62, 9, "t"]),
  "footer:marque": wire([2, 4, 60, 1, "l"], [4, 11, 12, 2, "t"], [4, 15, 10, 2, "t"], [4, 19, 11, 2, "t"], [24, 11, 12, 2, "t"], [24, 15, 10, 2, "t"], [44, 11, 3, 2, "l"], [49, 11, 11, 2, "t"], [44, 15, 3, 2, "l"], [49, 15, 9, 2, "t"], [2, 29, 40, 13, "i"]),
};

const wireBlockStyle = (
  [x, y, width, height, kind, radius = 0.5, rotate]: AtelierWireBlock,
  accent: string,
): CSSProperties => {
  const background = kind === "s"
    ? "var(--atelier-wire-soft, #e9e4d8)"
    : kind === "t"
      ? "var(--atelier-wire-ink, rgb(35 33 28 / 82%))"
      : kind === "l"
        ? "var(--atelier-wire-line, #d9d3c5)"
        : kind === "a"
          ? accent
          : kind === "i"
            ? "var(--atelier-wire-fill, #23211c)"
            : `color-mix(in oklab, ${accent} 42%, var(--atelier-wire-glow-base, #f3efe6))`;
  return {
    left: `${(x / 64) * 100}%`,
    top: `${(y / 44) * 100}%`,
    width: `${(width / 64) * 100}%`,
    height: `${(height / 44) * 100}%`,
    background,
    borderRadius: radius,
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
    filter: kind === "g" ? "blur(3px)" : undefined,
  };
};

/** Lightweight schematic used by the Atelier artifact. It communicates composition without
 * mounting several complete microsites inside the inspector, and is always derived from the
 * real section/variant key currently offered by the catalog. */
function AtelierStyleThumbnail({
  sectionType,
  variantId,
  accent,
  locked,
}: {
  sectionType: string;
  variantId: string;
  accent: string;
  locked: boolean;
}) {
  const blocks = ATELIER_WIREFRAMES[`${sectionType}:${variantId}`];
  return (
    <span
      className="atelier-style-wireframe"
      data-pattern={blocks ? "exact" : wireframePatternFor(sectionType, variantId)}
      style={{ "--atelier-wire-accent": accent } as CSSProperties}
      aria-hidden
    >
      {blocks
        ? blocks.map((block, index) => <i key={index} style={wireBlockStyle(block, accent)} />)
        : <><i /><i /><i /><i /><i /><i /></>}
      {locked ? (
        <span className="atelier-style-wireframe-lock">
          <Lock className="size-2.5" strokeWidth={2.2} />
        </span>
      ) : null}
    </span>
  );
}

export default SectionStylePicker;
