import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import TextField from "../../../../shared/components/forms/fields/TextField";
import { Switch } from "../../../../shared/components/ui/switch";
import { HeroImageUpload } from "../HeroImageUpload";
import { cn } from "../../../../shared/lib/utils";
import type { HeroConfig } from "../../types";

const GROUP_LABEL = "text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3";
const COVER_LAYOUTS = ["full", "plate"] as const;

interface HeroEditorProps {
  tagline: string;
  setTagline: (value: string) => void;
  taglineError?: string;
  heroImageUrl: string | null;
  canWrite: boolean;
  config: HeroConfig;
  onConfigChange: (patch: Partial<HeroConfig>) => void;
  /** Whether the business has any reviews yet — the rating toggle only appears when it does. */
  hasReviews: boolean;
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
  hasReviews,
}: HeroEditorProps) {
  const { t } = useTranslation("marketplace");
  const showEyebrow = config.showEyebrow !== false;
  const showRating = config.showRating !== false;
  const coverLayout = config.coverLayout ?? "full";

  return (
    <div className="space-y-4">
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

      <HeroImageUpload heroImageUrl={heroImageUrl} canWrite={canWrite} />

      {/* Cover layout — only meaningful once a cover photo exists. Full-bleed cinematic cover vs the
          "cover plate" (tall photo bleed with a paper card over it). No cover ⇒ drenched field, no choice. */}
      {heroImageUrl && (
        <div className="border-t border-border pt-4">
          <span className={GROUP_LABEL}>{t("businessPage.builder.hero.coverLayoutTitle")}</span>
          <p className="mt-1 text-[12px] leading-5 text-foreground-3">
            {t("businessPage.builder.hero.coverLayoutHint")}
          </p>
          <div
            role="radiogroup"
            aria-label={t("businessPage.builder.hero.coverLayoutTitle")}
            className="mt-3 inline-flex rounded-lg bg-surface-hover p-0.5"
          >
            {COVER_LAYOUTS.map((opt) => {
              const active = coverLayout === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!canWrite}
                  onClick={() => onConfigChange({ coverLayout: opt })}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[12.5px] font-medium outline-none transition-[color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring/50",
                    canWrite ? "cursor-pointer active:scale-[0.97]" : "cursor-not-allowed opacity-60",
                    active
                      ? "bg-surface text-primary-700 shadow-sm dark:text-primary-400"
                      : "text-foreground-3 hover:text-foreground-2",
                  )}
                >
                  {t(`businessPage.builder.hero.coverLayout_${opt}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
