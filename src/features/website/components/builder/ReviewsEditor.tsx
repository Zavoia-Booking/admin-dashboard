import { useTranslation } from "react-i18next";
import { Switch } from "../../../../shared/components/ui/switch";
import { modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import { GROUP_LABEL } from "./CopyOverride";
import { OptionalCopyOverride } from "./OptionalCopyOverride";
import { localeCopyIsHidden, setLocaleCopyHidden } from "./copyBlankState";
import type { ReviewsConfig } from "../../types";
import type { WebsiteDraftIssue } from "./draftValidation";

interface ReviewsEditorProps {
  config: ReviewsConfig;
  locale: "en" | "ro";
  onConfigChange: (patch: Partial<ReviewsConfig>) => void;
  blockingIssues?: WebsiteDraftIssue[];
}

/**
 * Reviews settings: the score, distribution bars, and quotes all come from your customers' reviews — the
 * owner controls only the heading and whether the rating-breakdown bars show.
 */
export function ReviewsEditor({
  config,
  locale,
  onConfigChange,
  blockingIssues = [],
}: ReviewsEditorProps) {
  const { t } = useTranslation("website");
  const headingError = blockingIssues.find(
    (issue) => issue.controlId === "reviews-heading" && (!issue.locale || issue.locale === locale),
  )?.message;

  const setHeading = (value: string) => {
    const current = config.heading ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ heading: hasOverride ? next : undefined });
  };
  const setHeadingBlank = (blank: boolean) => onConfigChange({
    headingHidden: setLocaleCopyHidden(config.headingHidden, locale, blank),
  });

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
        <OptionalCopyOverride
          idBase="reviews-heading"
          locale={locale}
          label={t("businessPage.builder.settings.headingLabel")}
          defaultText={t("businessPage.builder.preview.reviewsHeading")}
          value={config.heading?.[locale] ?? ""}
          blank={localeCopyIsHidden(config.headingHidden, locale)}
          onChange={setHeading}
          onBlankChange={setHeadingBlank}
          maxLength={80}
          rows={2}
          externalError={headingError}
        />
      </div>
    </div>
  );
}

export default ReviewsEditor;
