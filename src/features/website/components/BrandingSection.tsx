import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Check, ChevronDown } from "lucide-react";
import type { Business } from "../types";
import { cn } from "../../../shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../../../shared/components/ui/popover";
import { BRAND_ACCENTS, FALLBACK_BRAND, displayFontFor, safeBrandColor } from "./builder/theme";

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
          <img src={business.logo} alt="" className="h-full w-full object-cover" />
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
}: BrandColorControlProps) {
  const { t } = useTranslation("marketplace");
  const activeAccent = (brandColorHex || FALLBACK_BRAND).toLowerCase();
  const accentHex = safeBrandColor(brandColorHex);
  const activeAccentEntry = BRAND_ACCENTS.find((a) => a.hex.toLowerCase() === activeAccent);
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
