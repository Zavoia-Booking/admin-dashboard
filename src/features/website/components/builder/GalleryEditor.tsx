import { useTranslation } from "react-i18next";
import { modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import { CopyOverride } from "./CopyOverride";
import type { GalleryConfig } from "../../types";

interface GalleryEditorProps {
  config: GalleryConfig;
  locale: "en" | "ro";
  onConfigChange: (patch: Partial<GalleryConfig>) => void;
}

/**
 * Gallery settings: photos come from the locations' portfolios, so the only owner control is the heading
 * (defaults to the built-in copy until customized). Layout (editorial / bento / masonry / carousel) is the
 * variant pill rendered by the SectionBuilder.
 */
export function GalleryEditor({ config, locale, onConfigChange }: GalleryEditorProps) {
  const { t } = useTranslation("marketplace");

  const setHeading = (value: string) => {
    const current = config.heading ?? { en: "", ro: "" };
    onConfigChange({ heading: { ...current, [locale]: value } });
  };

  return (
    <div className="space-y-5">
      <p className={modalHelperSmall}>{t("businessPage.builder.settings.galleryHint")}</p>
      <CopyOverride
        idBase="gallery-heading"
        locale={locale}
        label={t("businessPage.builder.settings.headingLabel")}
        defaultText={t("businessPage.builder.preview.galleryHeading")}
        value={config.heading?.[locale] ?? ""}
        onChange={setHeading}
        maxLength={80}
        rows={2}
        customizeAria={t("businessPage.builder.settings.customize", {
          field: t("businessPage.builder.settings.headingLabel"),
        })}
      />
    </div>
  );
}

export default GalleryEditor;
