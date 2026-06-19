import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, Camera, Link2, Loader2, AlertCircle } from "lucide-react";
import type { Business } from "../../types";
import { cn } from "../../../../shared/lib/utils";
import { uploadBusinessLogo } from "../../../settings/api";
import { setBusinessLogoAction } from "../../actions";
import { slugify } from "../../utils/slugify";

const LOGO_ALLOWED = "image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif";
const DEFAULT_PICKER_COLOR = "#1B9C85";
// Public marketplace base for the read-only page address (prod domain). The page itself is served
// by the future /b/{slug} app — this is display-only.
const PUBLIC_PAGE_BASE = "zavoia.com/b/";

interface BrandingSectionProps {
  business: Business | null;
  canWrite: boolean;
  pageName: string;
  brandColorHex: string;
  setBrandColorHex: (value: string) => void;
  brandColorError?: string;
}

export function BrandingSection({
  business,
  canWrite,
  pageName,
  brandColorHex,
  setBrandColorHex,
  brandColorError,
}: BrandingSectionProps) {
  const { t } = useTranslation("marketplace");
  const dispatch = useDispatch();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(business?.logo ?? null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const validPickerColor = /^#[0-9a-fA-F]{6}$/.test(brandColorHex)
    ? brandColorHex
    : DEFAULT_PICKER_COLOR;

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
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-3">
        {t("businessPage.branding.title")}
      </span>

      <div className="flex flex-col gap-7">
        {/* Logo */}
        <div className="flex flex-col gap-2 shrink-0">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
            {t("businessPage.branding.logo.label")}
          </span>
          <div className="relative h-20 w-20">
            <div className="h-20 w-20 rounded-2xl border border-border bg-muted/20 dark:bg-neutral-900 overflow-hidden flex items-center justify-center">
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
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 dark:bg-neutral-900 px-3 py-2">
              <Link2 className="h-4 w-4 shrink-0 text-foreground-3" aria-hidden />
              <span className="font-mono text-sm break-all">
                <span className="text-foreground-3">{PUBLIC_PAGE_BASE}</span>
                <span className="text-foreground-1">{derivedSlug}</span>
              </span>
            </div>
          )}
          <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
            {t("businessPage.branding.slug.autoHint")}
          </p>
        </div>

        {/* Brand accent color */}
        <div className="space-y-2 pt-6 border-t border-border">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
              {t("businessPage.branding.brandColor.label")}
            </span>
            <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {t("businessPage.branding.brandColor.description")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label
              className="relative h-10 w-10 rounded-xl border border-border overflow-hidden shrink-0 cursor-pointer shadow-sm"
              style={{ backgroundColor: validPickerColor }}
            >
              <input
                type="color"
                value={validPickerColor}
                onChange={(e) => setBrandColorHex(e.target.value)}
                disabled={!canWrite}
                aria-label={t("businessPage.branding.brandColor.pickerLabel")}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input
              type="text"
              value={brandColorHex}
              onChange={(e) => setBrandColorHex(e.target.value)}
              disabled={!canWrite}
              placeholder="#1B9C85"
              maxLength={7}
              spellCheck={false}
              aria-label={t("businessPage.branding.brandColor.label")}
              className={cn(
                "h-10 w-32 rounded-xl border bg-surface px-3 text-sm font-mono uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-0",
                brandColorError
                  ? "border-destructive bg-error-bg focus-visible:ring-error"
                  : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus",
              )}
            />
          </div>
          <div className="h-5">
            {brandColorError && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{brandColorError}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingSection;
