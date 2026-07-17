import { useTranslation } from "react-i18next";
import { Switch } from "../../../../shared/components/ui/switch";
import type { FooterConfig } from "../../types";
import { GROUP_LABEL } from "./CopyOverride";

interface FooterEditorProps {
  config: FooterConfig;
  onConfigChange: (patch: Partial<FooterConfig>) => void;
}

/** Directory-only appearance control. Turning the uploaded logo off intentionally reveals the variant's
 * built-in initial + business-name lockup instead of leaving a hole in the composition. */
export function FooterEditor({ config, onConfigChange }: FooterEditorProps) {
  const { t } = useTranslation("website");
  const showLogo = config.showLogo !== false;

  return (
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
  );
}

export default FooterEditor;
