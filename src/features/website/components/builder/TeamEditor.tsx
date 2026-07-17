import { useTranslation } from "react-i18next";
import { modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import { CopyOverride } from "./CopyOverride";
import type { TeamConfig } from "../../types";

interface TeamEditorProps {
  config: TeamConfig;
  locale: "en" | "ro";
  onConfigChange: (patch: Partial<TeamConfig>) => void;
}

/**
 * Team section settings: the team itself is pulled from the business's locations, so the only owner
 * control is the editorial heading + sub-lede (each remains linked to the built-in copy until edited).
 * Layout (portraits vs roster) is the variant pill rendered by the SectionBuilder.
 */
export function TeamEditor({ config, locale, onConfigChange }: TeamEditorProps) {
  const { t } = useTranslation("website");

  const setCopy = (field: "heading" | "sublede", value: string) => {
    const current = config[field] ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ [field]: hasOverride ? next : undefined });
  };

  return (
    <div className="space-y-5">
      <p className={modalHelperSmall}>{t("businessPage.builder.settings.teamHint")}</p>
      <CopyOverride
        idBase="team-heading"
        locale={locale}
        label={t("businessPage.builder.settings.headingLabel")}
        defaultText={t("businessPage.builder.preview.subhead.team")}
        value={config.heading?.[locale] ?? ""}
        onChange={(v) => setCopy("heading", v)}
        maxLength={80}
        rows={2}
      />
      <div className="border-t border-border-subtle pt-5">
        <CopyOverride
          idBase="team-sublede"
          locale={locale}
          label={t("businessPage.builder.settings.subledeLabel")}
          defaultText={t("businessPage.builder.preview.sublede.team")}
          value={config.sublede?.[locale] ?? ""}
          onChange={(v) => setCopy("sublede", v)}
          maxLength={220}
          rows={3}
        />
      </div>
    </div>
  );
}

export default TeamEditor;
