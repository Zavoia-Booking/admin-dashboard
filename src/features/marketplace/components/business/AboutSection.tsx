import { useTranslation } from "react-i18next";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";

const MAX_ABOUT_LENGTH = 2000;

interface AboutSectionProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Long-form "about" content for the business page. Plain text for now (rich
 * formatting is deferred to a later step).
 */
export function AboutSection({ value, onChange }: AboutSectionProps) {
  const { t } = useTranslation("marketplace");

  return (
    <div className="space-y-6">
      <SectionDivider
        title={t("businessPage.about.title")}
        className="uppercase tracking-wider text-foreground-2"
      />

      <div className="group relative rounded-2xl p-4 border border-border bg-white dark:bg-surface flex flex-col gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-medium text-foreground-1">
            {t("businessPage.about.label")}
          </h3>
          <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
            {t("businessPage.about.description")}
          </p>
        </div>

        <TextareaField
          id="business-page-about"
          label=""
          placeholder={t("businessPage.about.placeholder")}
          value={value}
          onChange={onChange}
          maxLength={MAX_ABOUT_LENGTH}
          rows={6}
          className="!pt-0"
        />
      </div>
    </div>
  );
}

export default AboutSection;
