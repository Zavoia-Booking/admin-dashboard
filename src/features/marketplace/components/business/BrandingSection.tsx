import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, Camera, Check, ChevronDown, Loader2 } from "lucide-react";
import type { Business } from "../../types";
import { cn } from "../../../../shared/lib/utils";
import { uploadBusinessLogo } from "../../../settings/api";
import { setBusinessLogoAction } from "../../actions";
import { slugify } from "../../utils/slugify";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../shared/components/ui/popover";
import { BRAND_ACCENTS, FALLBACK_BRAND, displayFontFor, safeBrandColor } from "./builder/theme";

const LOGO_ALLOWED = "image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif";
// Public marketplace base for the read-only page address (prod domain). The page itself is served
// by the future /b/{slug} app — this is display-only.
const PUBLIC_PAGE_BASE = "zavoia.com/b/";

// Shared micro-label for each brand group (mirrors the section-list mono labels).
const GROUP_LABEL = "text-[11px] font-semibold uppercase text-foreground-3";

// The inline row (outside the popover) stays to a calm 8 spanning the palette's whole warm→cool→neutral
// arc (a plain first-8 slice would read all-warm); the popover is the overflow surface for the full set.
const INLINE_ACCENT_KEYS = new Set(["burgundy", "terracotta", "amber", "olive", "teal", "navy", "plum", "ink"]);
const INLINE_ACCENTS = BRAND_ACCENTS.filter((a) => INLINE_ACCENT_KEYS.has(a.key));

interface BrandingSectionProps {
  business: Business | null;
  canWrite: boolean;
  pageName: string;
  brandColorHex: string;
  /** Active display face — the lockup renders the page name in it so brand choices resolve live. */
  fontKey: string;
}

interface BrandColorControlProps {
  canWrite: boolean;
  brandColorHex: string;
  setBrandColorHex: (value: string) => void;
}

/**
 * Live identity lockup for the public page: logo upload, page name in the chosen display face,
 * and the generated public address. Styling controls live beside it in the parent editor surface.
 */
export function BrandingSection({
  business,
  canWrite,
  pageName,
  brandColorHex,
  fontKey,
}: BrandingSectionProps) {
  const { t } = useTranslation("marketplace");
  const dispatch = useDispatch();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(business?.logo ?? null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Selected swatch — falls back to the default accent so it always matches what the preview renders.
  const accentHex = safeBrandColor(brandColorHex);

  // The lockup renders the page name in the active display face (same stack the public page uses).
  const font = displayFontFor(fontKey);

  // V1: the page address is system-generated and read-only — a live preview of the slug we derive
  // from the public name (the backend persists the canonical, uniqueness-suffixed value on publish).
  const derivedSlug = slugify(pageName);

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isUploadingLogo) return;
    setIsUploadingLogo(true);
    try {
      const result = await uploadBusinessLogo(file);
      setLogoUrl(result.logo);
      // Mirror the new logo into marketplace state so the live preview hero updates immediately.
      dispatch(setBusinessLogoAction({ logo: result.logo, logoKey: result.logoKey }));
    } catch (error) {
      console.error("[Branding] Logo upload failed:", error);
      toast.error(t("businessPage.branding.logo.uploadFailed"));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
      <div className="relative size-16 shrink-0">
        <button
          type="button"
          onClick={() => canWrite && !isUploadingLogo && logoInputRef.current?.click()}
          disabled={!canWrite || isUploadingLogo}
          aria-label={
            isUploadingLogo
              ? t("businessPage.branding.logo.uploading")
              : t("businessPage.branding.logo.edit")
          }
          className={cn(
            "group/logo relative flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-xs outline-none transition-[transform,border-color] duration-150 ease-out hover:border-border-strong active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed dark:bg-neutral-900",
          )}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={t("businessPage.branding.logo.alt")} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-foreground-3" aria-hidden />
          )}
          <span
            className={cn(
              "absolute inset-0 grid place-items-center bg-neutral-950/45 text-white transition-opacity duration-150 ease-out",
              isUploadingLogo
                ? "opacity-100"
                : "opacity-0 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100",
            )}
            aria-hidden
          >
            {isUploadingLogo ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
          </span>
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept={LOGO_ALLOWED}
          className="hidden"
          onChange={handleLogoSelect}
          disabled={!canWrite || isUploadingLogo}
        />
      </div>

      <div className="min-w-0">
        <span className={GROUP_LABEL}>{t("businessPage.branding.title")}</span>
        <div
          key={font.key}
          className="mt-1.5 truncate text-[23px] leading-[1.08] text-foreground-1 sm:text-[25px]"
          style={{ fontFamily: font.stack, fontWeight: font.weight, letterSpacing: font.tracking }}
        >
          {pageName || t("businessPage.branding.namePlaceholder")}
        </div>
        {derivedSlug && (
          <div
            className="mt-2 flex min-w-0 items-center gap-1.5"
            title={t("businessPage.branding.slug.autoHint")}
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: accentHex }}
              aria-hidden
            />
            <span className="min-w-0 truncate font-mono text-[11px] leading-none">
              <span className="text-foreground-3">{PUBLIC_PAGE_BASE}</span>
              <span className="text-foreground-2">{derivedSlug}</span>
            </span>
          </div>
        )}
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

  const renderSwatch = ({ key, hex }: { key: string; hex: string }) => {
    const selected = activeAccent === hex.toLowerCase();
    const name = t(`businessPage.branding.brandColor.swatches.${key}`);
    return (
      <button
        key={key}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={name}
        title={name}
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
        {selected && (
          <span className="absolute inset-0 grid place-items-center" aria-hidden>
            <Check className="size-3.5 text-white" strokeWidth={2.4} />
          </span>
        )}
      </button>
    );
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
                "group/accent inline-flex h-8 max-w-[190px] items-center gap-2 rounded-full border border-border bg-surface px-2.5 text-left outline-none transition-[transform,border-color,background-color] duration-150 ease-out",
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
      >
        {INLINE_ACCENTS.map(renderSwatch)}
      </div>
    </div>
  );
}

export default BrandingSection;
