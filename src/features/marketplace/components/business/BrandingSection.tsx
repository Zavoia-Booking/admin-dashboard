import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, Camera, Link2, Loader2, Check, X, AlertCircle } from "lucide-react";
import type { Business } from "../../types";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import TextField from "../../../../shared/components/forms/fields/TextField";
import { cn } from "../../../../shared/lib/utils";
import { uploadBusinessLogo } from "../../../settings/api";
import { useSlugAvailability } from "../../hooks/useSlugAvailability";
import { HeroImageUpload } from "./HeroImageUpload";

const LOGO_ALLOWED = "image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif";
const DEFAULT_PICKER_COLOR = "#1B9C85";

interface BrandingSectionProps {
  business: Business | null;
  canWrite: boolean;
  heroImageUrl: string | null;
  tagline: string;
  setTagline: (value: string) => void;
  taglineError?: string;
  businessSlug: string;
  setBusinessSlug: (value: string) => void;
  slugError?: string;
  brandColorHex: string;
  setBrandColorHex: (value: string) => void;
  brandColorError?: string;
}

export function BrandingSection({
  business,
  canWrite,
  heroImageUrl,
  tagline,
  setTagline,
  taglineError,
  businessSlug,
  setBusinessSlug,
  slugError,
  brandColorHex,
  setBrandColorHex,
  brandColorError,
}: BrandingSectionProps) {
  const { t } = useTranslation("marketplace");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(business?.logo ?? null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const slugStatus = useSlugAvailability(businessSlug, business?.businessSlug);
  const validPickerColor = /^#[0-9a-fA-F]{6}$/.test(brandColorHex)
    ? brandColorHex
    : DEFAULT_PICKER_COLOR;

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isUploadingLogo) return;
    setIsUploadingLogo(true);
    try {
      const result = await uploadBusinessLogo(file);
      setLogoUrl(result.logo);
    } catch (error) {
      console.error("[Branding] Logo upload failed:", error);
      toast.error(t("businessPage.branding.logo.uploadFailed"));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionDivider
        title={t("businessPage.branding.title")}
        className="uppercase tracking-wider text-foreground-2"
      />

      <div className="group relative rounded-2xl p-4 border border-border bg-white dark:bg-surface flex flex-col gap-6">
        {/* Logo + tagline */}
        <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
          {/* Logo */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-sm font-medium text-foreground-1">
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

          {/* Tagline */}
          <div className="flex-1 min-w-0">
            <TextField
              id="business-page-tagline"
              label={t("businessPage.branding.tagline.label")}
              placeholder={t("businessPage.branding.tagline.placeholder")}
              value={tagline}
              onChange={setTagline}
              error={taglineError}
              icon={Building2}
              maxLength={200}
              className="!pt-0"
            />
          </div>
        </div>

        {/* Hero / cover image */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground-1">
              {t("businessPage.branding.hero.label")}
            </span>
            <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {t("businessPage.branding.hero.description")}
            </p>
          </div>
          <HeroImageUpload heroImageUrl={heroImageUrl} canWrite={canWrite} />
        </div>

        {/* Vanity slug */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <TextField
            id="business-page-slug"
            label={t("businessPage.branding.slug.label")}
            placeholder={t("businessPage.branding.slug.placeholder")}
            value={businessSlug}
            onChange={(v) => setBusinessSlug(v.toLowerCase().replace(/\s+/g, "-"))}
            error={slugError}
            icon={Link2}
            maxLength={100}
            className="!pt-0"
          />
          <div className="flex items-center justify-between gap-2 min-h-5">
            <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {t("businessPage.branding.slug.helper")}
            </p>
            {slugStatus === "checking" && (
              <span className="inline-flex items-center gap-1 text-xs text-foreground-3 shrink-0">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("businessPage.branding.slug.checking")}
              </span>
            )}
            {slugStatus === "available" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 shrink-0">
                <Check className="h-3.5 w-3.5" />
                {t("businessPage.branding.slug.available")}
              </span>
            )}
            {slugStatus === "taken" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive shrink-0">
                <X className="h-3.5 w-3.5" />
                {t("businessPage.branding.slug.taken")}
              </span>
            )}
          </div>
        </div>

        {/* Brand accent color */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground-1">
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
                aria-label={t("businessPage.branding.brandColor.label")}
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
