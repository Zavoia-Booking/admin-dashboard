import { useTranslation } from "react-i18next";
import { Input } from "../../../../../shared/components/ui/input";
import { Label } from "../../../../../shared/components/ui/label";
import type { AnnouncementContent } from "../../../types";

interface AnnouncementEditorProps {
  value: AnnouncementContent;
  onChange: (value: AnnouncementContent) => void;
  locale: "en" | "ro";
}

/** Bilingual announcement message (per active locale) + an optional, locale-agnostic link. */
export function AnnouncementEditor({ value, onChange, locale }: AnnouncementEditorProps) {
  const { t } = useTranslation("marketplace");

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="announcement-message">{t("businessPage.builder.announcement.messageLabel")}</Label>
        <Input
          id="announcement-message"
          value={value.message[locale]}
          onChange={(e) =>
            onChange({ ...value, message: { ...value.message, [locale]: e.target.value } })
          }
          placeholder={t("businessPage.builder.announcement.messagePlaceholder")}
          maxLength={140}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="announcement-link">{t("businessPage.builder.announcement.linkLabel")}</Label>
        <Input
          id="announcement-link"
          value={value.link ?? ""}
          onChange={(e) => onChange({ ...value, link: e.target.value })}
          placeholder={t("businessPage.builder.announcement.linkPlaceholder")}
          inputMode="url"
          maxLength={300}
        />
      </div>
    </div>
  );
}

export default AnnouncementEditor;
