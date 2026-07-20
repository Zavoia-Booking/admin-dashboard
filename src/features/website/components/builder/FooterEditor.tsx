import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import { Switch } from "../../../../shared/components/ui/switch";
import {
  hasUnsafeWebsiteCopyCharacters,
  validateWebsiteCopy,
} from "../../../../shared/utils/validation";
import type { FooterConfig } from "../../types";
import { GROUP_LABEL } from "./CopyOverride";
import { OptionalCopyOverride } from "./OptionalCopyOverride";
import { localeCopyIsHidden, setLocaleCopyHidden } from "./copyBlankState";
import type { WebsiteDraftIssue } from "./draftValidation";

interface FooterEditorProps {
  config: FooterConfig;
  locale: "en" | "ro";
  showHeadlineControl: boolean;
  showDescriptionControl?: boolean;
  defaultHeadline: string;
  showLogoControl: boolean;
  onConfigChange: (patch: Partial<FooterConfig>) => void;
  blockingIssues?: WebsiteDraftIssue[];
}

/** Editorial's closing headline, shared description copy, and Directory's logo treatment. */
export function FooterEditor({
  config,
  locale,
  showHeadlineControl,
  showDescriptionControl = true,
  defaultHeadline,
  showLogoControl,
  onConfigChange,
  blockingIssues = [],
}: FooterEditorProps) {
  const { t } = useTranslation("website");
  const [descriptionBlurred, setDescriptionBlurred] = useState(false);
  const showLogo = config.showLogo !== false;
  const description = config.description?.[locale] ?? "";
  const descriptionValidation = validateWebsiteCopy(description, t, {
    fieldLabel: t("businessPage.builder.settings.footerDescriptionLabel"),
    maxLength: 120,
  });
  const issueFor = (controlId: string) => blockingIssues.find(
    (issue) => issue.controlId === controlId && (!issue.locale || issue.locale === locale),
  )?.message;
  const localDescriptionError = descriptionValidation && (
    descriptionBlurred || hasUnsafeWebsiteCopyCharacters(description)
  )
    ? descriptionValidation
    : undefined;
  const descriptionError = issueFor("footer-description") ?? localDescriptionError;

  useEffect(() => setDescriptionBlurred(false), [locale]);

  const setHeadline = (value: string) => {
    const current = config.headline ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ headline: hasOverride ? next : undefined });
  };

  const setHeadlineBlank = (blank: boolean) => {
    onConfigChange({
      headlineHidden: setLocaleCopyHidden(config.headlineHidden, locale, blank),
    });
  };

  const setDescription = (value: string) => {
    const current = config.description ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ description: hasOverride ? next : undefined });
  };

  return (
    <div className="space-y-5">
      {showHeadlineControl ? (
        <OptionalCopyOverride
          idBase="footer-headline"
          locale={locale}
          label={t("businessPage.builder.settings.footerHeadlineLabel")}
          defaultText={defaultHeadline}
          value={config.headline?.[locale] ?? ""}
          blank={localeCopyIsHidden(config.headlineHidden, locale)}
          onChange={setHeadline}
          onBlankChange={setHeadlineBlank}
          maxLength={80}
          rows={2}
          externalError={issueFor("footer-headline")}
        />
      ) : null}

      {showDescriptionControl ? (
        <TextareaField
          id="footer-description"
          label={t("businessPage.builder.settings.footerDescriptionLabel")}
          labelMeta={(
            <span className="text-xs font-normal text-foreground-3">
              {t("businessPage.builder.settings.footerDescriptionOptional")}
            </span>
          )}
          placeholder={t("businessPage.builder.settings.footerDescriptionPlaceholder")}
          helperText={t("businessPage.builder.settings.footerDescriptionHint")}
          value={description}
          onChange={setDescription}
          onBlur={() => {
            const normalized = description.trim();
            if (normalized !== description) setDescription(normalized);
            setDescriptionBlurred(true);
          }}
          error={descriptionError}
          maxLength={120}
          rows={3}
          showCharacterCount
          className="!pt-0"
          textareaClassName="!h-auto min-h-20"
        />
      ) : null}

      {showLogoControl ? (
        <div className="flex items-start justify-between gap-4 border-y border-border py-4">
          <div className="min-w-0">
            <span className={GROUP_LABEL}>{t("businessPage.builder.settings.footerLogoTitle")}</span>
            <p className="mt-1 text-[12px] leading-5 text-foreground-3">
              {t("businessPage.builder.settings.footerLogoHint")}
            </p>
          </div>
          <Switch
            checked={showLogo}
            onCheckedChange={(checked) => onConfigChange({ showLogo: checked })}
            aria-label={t("businessPage.builder.settings.footerLogoToggle")}
          />
        </div>
      ) : null}
    </div>
  );
}

export default FooterEditor;
