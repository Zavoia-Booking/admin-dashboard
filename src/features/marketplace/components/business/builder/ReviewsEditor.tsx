import { useTranslation } from "react-i18next";
import { Switch } from "../../../../../shared/components/ui/switch";
import { modalHelperSmall } from "../../../../../shared/components/ui/modal-tokens";
import { CopyOverride, GROUP_LABEL } from "./CopyOverride";
import type { ReviewsConfig } from "../../../types";

interface ReviewsEditorProps {
  config: ReviewsConfig;
  locale: "en" | "ro";
  onConfigChange: (patch: Partial<ReviewsConfig>) => void;
}

/**
 * Reviews settings: the score, distribution bars, and quotes all come from your customers' reviews — the
 * owner controls only the heading + sub-lede and whether the rating-breakdown bars show.
 */
export function ReviewsEditor({ config, locale, onConfigChange }: ReviewsEditorProps) {
  const { t } = useTranslation("marketplace");

  const setCopy = (field: "heading" | "sublede", value: string) => {
    const current = config[field] ?? { en: "", ro: "" };
    onConfigChange({ [field]: { ...current, [locale]: value } });
  };

  return (
    <div className="space-y-5">
      <p className={modalHelperSmall}>{t("businessPage.builder.settings.reviewsHint")}</p>

      <div className="flex items-center justify-between gap-4">
        <span className={GROUP_LABEL}>{t("businessPage.builder.settings.reviewsDistributionLabel")}</span>
        <Switch
          checked={config.hideDistribution !== true}
          onCheckedChange={(v) => onConfigChange({ hideDistribution: !v })}
          aria-label={t("businessPage.builder.settings.reviewsDistributionLabel")}
        />
      </div>

      <div className="border-t border-border pt-5">
        <CopyOverride
          idBase="reviews-heading"
          locale={locale}
          label={t("businessPage.builder.settings.headingLabel")}
          defaultText={t("businessPage.builder.preview.reviewsHeading")}
          value={config.heading?.[locale] ?? ""}
          onChange={(v) => setCopy("heading", v)}
          maxLength={80}
          rows={2}
          customizeAria={t("businessPage.builder.settings.customize", {
            field: t("businessPage.builder.settings.headingLabel"),
          })}
        />
        <div className="mt-5 border-t border-border-subtle pt-5">
          <CopyOverride
            idBase="reviews-sublede"
            locale={locale}
            label={t("businessPage.builder.settings.subledeLabel")}
            defaultText={t("businessPage.builder.preview.reviewsSublede")}
            value={config.sublede?.[locale] ?? ""}
            onChange={(v) => setCopy("sublede", v)}
            maxLength={220}
            rows={3}
            customizeAria={t("businessPage.builder.settings.customize", {
              field: t("businessPage.builder.settings.subledeLabel"),
            })}
          />
        </div>
      </div>
    </div>
  );
}

export default ReviewsEditor;
