import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, Camera, ChevronDown, Loader2, Lock } from "lucide-react";
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
const GROUP_LABEL = "text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3";
const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";

const freeAccents = BRAND_ACCENTS.filter((a) => !a.pro);
const proAccents = BRAND_ACCENTS.filter((a) => a.pro);

interface BrandingSectionProps {
  business: Business | null;
  canWrite: boolean;
  pageName: string;
  brandColorHex: string;
  setBrandColorHex: (value: string) => void;
  /** Active display face — the lockup renders the page name in it so brand choices resolve live. */
  fontKey: string;
}

/**
 * The brand controls for the horizontal band above the section list, as two grid cells:
 *  1. a live identity lockup — the logo (hover to upload) beside the page name in the chosen display
 *     face and the public address, so logo + typeface + accent resolve exactly as the public page reads;
 *  2. the accent control — a compact current-colour chip that opens the full palette in a popover,
 *     grouped Included / Pro (Pro swatches are previewable but need an upgrade to save).
 * Returns a fragment so each cell sits directly in the band grid alongside the typeface group.
 */
export function BrandingSection({
  business,
  canWrite,
  pageName,
  brandColorHex,
  setBrandColorHex,
  fontKey,
}: BrandingSectionProps) {
  const { t } = useTranslation("marketplace");
  const dispatch = useDispatch();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(business?.logo ?? null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Selected swatch — falls back to the default accent so it always matches what the preview renders.
  const activeAccent = (brandColorHex || FALLBACK_BRAND).toLowerCase();
  const accentHex = safeBrandColor(brandColorHex);
  const activeAccentEntry = BRAND_ACCENTS.find((a) => a.hex.toLowerCase() === activeAccent);
  const activeAccentName = activeAccentEntry
    ? t(`businessPage.branding.brandColor.swatches.${activeAccentEntry.key}`)
    : accentHex.toUpperCase();

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

  const renderSwatch = ({ key, hex, pro }: { key: string; hex: string; pro?: boolean }) => {
    const selected = activeAccent === hex.toLowerCase();
    const name = t(`businessPage.branding.brandColor.swatches.${key}`);
    return (
      <button
        key={key}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={pro ? `${name} · ${t("businessPage.pro.badge")}` : name}
        title={name}
        disabled={!canWrite}
        onClick={() => setBrandColorHex(hex)}
        style={{ backgroundColor: hex }}
        className={cn(
          "relative h-7 w-7 rounded-full outline-none transition-transform duration-150",
          EASE,
          "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
          canWrite ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-not-allowed opacity-60",
          selected
            ? "scale-105 shadow-sm ring-2 ring-foreground-1 ring-offset-2 ring-offset-popover"
            : "ring-1 ring-inset ring-black/10 dark:ring-white/20",
        )}
      >
        {pro && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-popover ring-1 ring-black/10 dark:ring-white/15"
          >
            <Lock className="h-2 w-2 text-foreground-3" strokeWidth={2.5} />
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Identity — logo (hover to upload) + a live lockup of the page name in the chosen face + address */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
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
              "group/logo relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-sm outline-none transition-shadow duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed dark:bg-neutral-900",
              EASE,
            )}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={t("businessPage.branding.logo.alt")} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-foreground-3" aria-hidden />
            )}
            {/* upload affordance — scrim + camera revealed on hover/focus; spinner while uploading */}
            <span
              className={cn(
                "absolute inset-0 grid place-items-center bg-neutral-950/45 text-white transition-opacity duration-200",
                EASE,
                isUploadingLogo
                  ? "opacity-100"
                  : "opacity-0 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100",
              )}
              aria-hidden
            >
              {isUploadingLogo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
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
          {/* keyed by face so the name gently reblooms when the typeface changes */}
          <div
            key={font.key}
            className="truncate text-[21px] leading-[1.15] text-foreground-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-safe:ease-out"
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
                className="h-1.5 w-1.5 shrink-0 rounded-full"
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

      {/* Accent — a compact current-colour chip that opens the full palette (Included / Pro) in a popover */}
      <div className="flex min-w-0 flex-col gap-3 2xl:border-l 2xl:border-border-subtle 2xl:pl-8">
        <span className={GROUP_LABEL}>{t("businessPage.branding.brandColor.label")}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!canWrite}
              aria-label={t("businessPage.branding.brandColor.label")}
              className={cn(
                "group/accent flex w-full max-w-[220px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 text-left outline-none transition-[border-color,box-shadow] duration-200",
                EASE,
                "hover:border-border-strong focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <span
                className="h-6 w-6 shrink-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: accentHex }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground-1">{activeAccentName}</span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-foreground-3 transition-transform duration-200 group-data-[state=open]/accent:rotate-180"
                strokeWidth={1.8}
                aria-hidden
              />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[336px] p-4 md:w-[336px]">
            <div className="space-y-3.5">
              <div className="space-y-2">
                <span className={GROUP_LABEL}>{t("businessPage.branding.brandColor.included")}</span>
                <div
                  role="radiogroup"
                  aria-label={t("businessPage.branding.brandColor.included")}
                  className="grid grid-cols-8 gap-2.5"
                >
                  {freeAccents.map(renderSwatch)}
                </div>
              </div>
              <div className="space-y-2 border-t border-border-subtle pt-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
                  <Lock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                  {t("businessPage.branding.brandColor.proGroup")}
                </span>
                <div
                  role="radiogroup"
                  aria-label={t("businessPage.branding.brandColor.proGroup")}
                  className="grid grid-cols-8 gap-2.5"
                >
                  {proAccents.map(renderSwatch)}
                </div>
              </div>
              <p className="text-[11px] leading-snug text-foreground-3">
                {t("businessPage.branding.brandColor.previewHint")}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

export default BrandingSection;
