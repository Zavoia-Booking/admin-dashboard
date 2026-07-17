import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import TextField from "../../../../shared/components/forms/fields/TextField";
import { Switch } from "../../../../shared/components/ui/switch";
import { HeroImageUpload } from "../HeroImageUpload";
import { cn } from "../../../../shared/lib/utils";
import type { HeroConfig, LocationWithAssignments } from "../../types";
import { CopyOverride } from "./CopyOverride";
import { defaultHeroEyebrow } from "./heroEyebrow";
import { hasUnsafeWebsiteCopyCharacters } from "../../../../shared/utils/validation";

const GROUP_LABEL = "text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3";

interface HeroEditorProps {
  tagline: string;
  setTagline: (value: string) => void;
  taglineError?: string;
  heroImageUrl: string | null;
  canWrite: boolean;
  config: HeroConfig;
  onConfigChange: (patch: Partial<HeroConfig>) => void;
  locations: LocationWithAssignments[];
  locale: "en" | "ro";
  /** Whether the business has any reviews yet — the rating toggle only appears when it does. */
  hasReviews: boolean;
  /** Presentation only: the Atelier inspector uses compact editorial field treatment. */
  variant?: "default" | "atelier";
  /** Style currently shown in the preview, including an unsaved premium preview. */
  previewVariant?: string;
}

/**
 * Hero section content, edited inline in the builder (alongside About / FAQ / Announcement): the
 * tagline and cover image at the top of the draft preview, plus the show/hide controls for the intro
 * line and (once the business has reviews) the rating. The booking button copy is fixed. Logo
 * and brand colour stay in the Branding panel (global identity).
 */
export function HeroEditor({
  tagline,
  setTagline,
  taglineError,
  heroImageUrl,
  canWrite,
  config,
  onConfigChange,
  locations,
  locale,
  hasReviews,
  variant = "default",
  previewVariant,
}: HeroEditorProps) {
  const { t } = useTranslation("website");
  const [taglineBlurred, setTaglineBlurred] = useState(false);
  const showEyebrow = config.showEyebrow !== false;
  const showRating = config.showRating !== false;
  const inheritedEyebrow = defaultHeroEyebrow(locations, t);
  const coverRecommended =
    !heroImageUrl && (previewVariant === "cinematic" || previewVariant === "portal");
  const visibleTaglineError = taglineError && (
    taglineBlurred ||
    tagline.length > 200 ||
    hasUnsafeWebsiteCopyCharacters(tagline)
  )
    ? taglineError
    : undefined;
  const setEyebrow = (value: string) => {
    const current = config.eyebrow ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ eyebrow: hasOverride ? next : undefined });
  };

  return (
    <div className={cn("space-y-4", variant === "atelier" && "atelier-hero-editor")}>
      <TextField
        id="business-page-tagline"
        label={t("businessPage.branding.tagline.label")}
        placeholder={t("businessPage.branding.tagline.placeholder")}
        value={tagline}
        onChange={setTagline}
        onBlur={() => {
          if (tagline.trim() !== tagline) setTagline(tagline.trim());
          setTaglineBlurred(true);
        }}
        error={visibleTaglineError}
        icon={variant === "atelier" ? null : Building2}
        maxLength={200}
        className={cn("!pt-0", variant === "atelier" && "atelier-hero-tagline-field")}
      />

      {coverRecommended ? (
        <div
          id="hero-cover-recommendation"
          role="note"
          tabIndex={-1}
          className="rounded-xl border border-primary/40 bg-surface px-4 py-3 shadow-xs outline-none"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-primary">
            {t("businessPage.builder.hero.coverRecommendationEyebrow")}
          </p>
          <p className="mt-1 text-[12px] font-medium leading-[1.55] text-foreground-1">
            {t("businessPage.builder.hero.coverRecommendation")}
          </p>
        </div>
      ) : null}

      <HeroImageUpload heroImageUrl={heroImageUrl} canWrite={canWrite} variant={variant} />

      {/* Intro line (eyebrow) — show/hide; the line itself is auto-built from the locations. */}
      <div className="flex items-start justify-between gap-3 border-t border-border pt-4">
        <div>
          <span className={GROUP_LABEL}>{t("businessPage.builder.hero.eyebrowTitle")}</span>
          <p className="mt-1 text-[12px] leading-5 text-foreground-3">
            {t("businessPage.builder.hero.eyebrowHint")}
          </p>
        </div>
        <Switch
          aria-label={t("businessPage.builder.hero.eyebrowToggle")}
          checked={showEyebrow}
          onCheckedChange={(v) => onConfigChange({ showEyebrow: v })}
        />
      </div>

      {showEyebrow && (inheritedEyebrow || config.eyebrow?.[locale]?.trim()) ? (
        <CopyOverride
          idBase="hero-eyebrow"
          locale={locale}
          label={t("businessPage.builder.hero.eyebrowCopyLabel")}
          defaultText={inheritedEyebrow}
          value={config.eyebrow?.[locale] ?? ""}
          onChange={setEyebrow}
          maxLength={80}
          rows={2}
        />
      ) : null}

      {/* Rating & reviews — show/hide. Hidden entirely until the business has reviews. */}
      {hasReviews && (
        <div className="flex items-start justify-between gap-3 border-t border-border pt-4">
          <div>
            <span className={GROUP_LABEL}>{t("businessPage.builder.hero.ratingTitle")}</span>
            <p className="mt-1 text-[12px] leading-5 text-foreground-3">
              {t("businessPage.builder.hero.ratingHint")}
            </p>
          </div>
          <Switch
            aria-label={t("businessPage.builder.hero.ratingToggle")}
            checked={showRating}
            onCheckedChange={(v) => onConfigChange({ showRating: v })}
          />
        </div>
      )}
    </div>
  );
}

export default HeroEditor;
