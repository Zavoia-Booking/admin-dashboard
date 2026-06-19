import { useTranslation } from "react-i18next";
import { Textarea } from "../../../../../shared/components/ui/textarea";
import { Label } from "../../../../../shared/components/ui/label";

const MAX_ABOUT_LENGTH = 2000;

interface AboutEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Long-form "about" content for the business page, edited inline in the section builder (alongside
 * FAQ / Announcement). Single-language: `aboutContent` is a plain string, so — unlike the bilingual
 * editors — there is no EN/RO toggle. Plain text for now (rich formatting deferred).
 */
export function AboutEditor({ value, onChange }: AboutEditorProps) {
  const { t } = useTranslation("marketplace");

  return (
    <div className="space-y-1.5">
      <Label htmlFor="business-page-about">{t("businessPage.about.label")}</Label>
      <p className="text-xs text-foreground-3">{t("businessPage.about.description")}</p>
      <Textarea
        id="business-page-about"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("businessPage.about.placeholder")}
        maxLength={MAX_ABOUT_LENGTH}
        rows={6}
      />
    </div>
  );
}

export default AboutEditor;
