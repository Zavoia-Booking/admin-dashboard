import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import TextField from "../../../../../shared/components/forms/fields/TextField";
import { Label } from "../../../../../shared/components/ui/label";
import { HeroImageUpload } from "../HeroImageUpload";

interface HeroEditorProps {
  tagline: string;
  setTagline: (value: string) => void;
  taglineError?: string;
  heroImageUrl: string | null;
  canWrite: boolean;
}

/**
 * Hero section content, edited inline in the builder (alongside About / FAQ / Announcement): the
 * tagline and the cover image that sit at the top of the public page — edited where they're arranged.
 * Logo, slug and brand colour stay in the Branding panel: those are global identity, reused across the
 * marketplace, not hero-only.
 */
export function HeroEditor({
  tagline,
  setTagline,
  taglineError,
  heroImageUrl,
  canWrite,
}: HeroEditorProps) {
  const { t } = useTranslation("marketplace");

  return (
    <div className="space-y-5">
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

      <div className="space-y-1.5">
        <Label>{t("businessPage.branding.hero.label")}</Label>
        <p className="text-xs text-foreground-3">{t("businessPage.branding.hero.description")}</p>
        <HeroImageUpload heroImageUrl={heroImageUrl} canWrite={canWrite} />
      </div>
    </div>
  );
}

export default HeroEditor;
