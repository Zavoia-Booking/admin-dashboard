import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, Camera, Link2, Loader2 } from "lucide-react";
import type { Business } from "../../types";
import { cn } from "../../../../shared/lib/utils";
import { uploadBusinessLogo } from "../../../settings/api";
import { setBusinessLogoAction } from "../../actions";
import { slugify } from "../../utils/slugify";
import { modalEyebrow } from "../../../../shared/components/ui/modal-tokens";
import { BRAND_ACCENTS, FALLBACK_BRAND } from "./builder/theme";

const LOGO_ALLOWED = "image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif";
// Public marketplace base for the read-only page address (prod domain). The page itself is served
// by the future /b/{slug} app — this is display-only.
const PUBLIC_PAGE_BASE = "zavoia.com/b/";

interface BrandingSectionProps {
  business: Business | null;
  canWrite: boolean;
  pageName: string;
  brandColorHex: string;
  setBrandColorHex: (value: string) => void;
}

export function BrandingSection({
  business,
  canWrite,
  pageName,
  brandColorHex,
  setBrandColorHex,
}: BrandingSectionProps) {
  const { t } = useTranslation("marketplace");
  const dispatch = useDispatch();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(business?.logo ?? null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Selected swatch — falls back to the default accent so it always matches what the preview renders.
  const activeAccent = (brandColorHex || FALLBACK_BRAND).toLowerCase();

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
    <div className="space-y-6">
      <span className={cn(modalEyebrow, "mb-0 block")}>
        {t("businessPage.branding.title")}
      </span>

      <div className="flex flex-col gap-7">
        {/* Logo */}
        <div className="flex flex-col gap-2 shrink-0">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
            {t("businessPage.branding.logo.label")}
          </span>
          <div className="relative h-20 w-20">
            <div className="h-20 w-20 rounded-2xl border border-border bg-surface shadow-sm overflow-hidden flex items-center justify-center transition-shadow duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-md dark:bg-neutral-900">
              {logoUrl ? (
                <img src={logoUrl} alt={t("businessPage.branding.logo.alt")} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-7 w-7 text-foreground-3" aria-hidden />
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept={LOGO_ALLOWED}
              className="hidden"
              onChange={handleLogoSelect}
              disabled={!canWrite || isUploadingLogo}
            />
            <button
              type="button"
              onClick={() => canWrite && !isUploadingLogo && logoInputRef.current?.click()}
              disabled={!canWrite || isUploadingLogo}
              aria-label={
                isUploadingLogo
                  ? t("businessPage.branding.logo.uploading")
                  : t("businessPage.branding.logo.edit")
              }
              className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-primary text-primary-foreground border-2 border-background shadow-md flex items-center justify-center active:scale-95 transition-transform duration-200 disabled:opacity-60"
            >
              {isUploadingLogo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Page address — system-generated from the business name, read-only in V1 */}
        <div className="space-y-1.5 pt-6 border-t border-border">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
            {t("businessPage.branding.slug.label")}
          </span>
          {derivedSlug && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface shadow-sm px-3 py-2.5 dark:bg-neutral-900">
              <Link2 className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
              <span className="font-mono text-sm break-all leading-tight">
                <span className="text-foreground-3">{PUBLIC_PAGE_BASE}</span>
                <span className="font-medium text-foreground-1">{derivedSlug}</span>
              </span>
            </div>
          )}
          <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
            {t("businessPage.branding.slug.autoHint")}
          </p>
        </div>

        {/* Brand accent color — one swatch from a curated set tuned for the page palette */}
        <div className="space-y-2.5 pt-6 border-t border-border">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
              {t("businessPage.branding.brandColor.label")}
            </span>
            <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {t("businessPage.branding.brandColor.description")}
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label={t("businessPage.branding.brandColor.label")}
            className="grid w-fit grid-cols-5 gap-3 pt-1"
          >
            {BRAND_ACCENTS.map(({ key, hex }) => {
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
                    "h-8 w-8 rounded-full outline-none transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    // Selection = a clean halo (ring with a gap in the panel's own surface colour) + a slight lift;
                    // unselected swatches get a hairline edge so the lightest fills read against the panel.
                    "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                    canWrite ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-not-allowed opacity-60",
                    selected
                      ? "scale-105 ring-2 ring-foreground-1 ring-offset-2 ring-offset-surface"
                      : "ring-1 ring-inset ring-black/10 dark:ring-white/20",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingSection;
