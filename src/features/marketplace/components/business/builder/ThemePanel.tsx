import { useTranslation } from "react-i18next";
import { cn } from "../../../../../shared/lib/utils";
import { FONT_OPTIONS } from "./theme";

interface ThemePanelProps {
  fontKey: string;
  onFontChange: (key: string) => void;
}

/** The font half of the brand theme (brand colour lives in the Branding form — one colour source).
 *  Editorial: live "Aa" specimens, the active one inked + underlined, the rest receded. */
export function ThemePanel({ fontKey, onFontChange }: ThemePanelProps) {
  const { t } = useTranslation("marketplace");
  return (
    <div>
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
        {t("businessPage.theme.fontLabel")}
      </span>
      <div className="mt-3 flex flex-wrap items-end gap-7">
        {FONT_OPTIONS.map((f) => {
          const active = fontKey === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onFontChange(f.key)}
              aria-pressed={active}
              className={cn(
                "group/font text-left outline-none transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:opacity-100",
                active ? "opacity-100" : "opacity-50 hover:opacity-90",
              )}
            >
              <span className="relative inline-block leading-none">
                <span className="block text-[27px] text-foreground-1" style={{ fontFamily: f.stack }}>
                  Aa
                </span>
                {active && (
                  <span className="absolute -bottom-1.5 left-0 h-[2px] w-full bg-foreground-1" />
                )}
              </span>
              <span className="mt-2.5 block text-[10.5px] text-foreground-3">{t(f.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemePanel;
