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
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {FONT_OPTIONS.map((f) => {
          const active = fontKey === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onFontChange(f.key)}
              aria-pressed={active}
              className={cn(
                "group/font flex flex-col items-start gap-2 rounded-xl border px-3 py-2.5 text-left outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50",
                active
                  ? "border-primary/40 bg-primary/[0.06] shadow-sm dark:bg-primary/[0.10]"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover/60",
              )}
            >
              <span className="text-[26px] leading-none text-foreground-1" style={{ fontFamily: f.stack }}>
                Aa
              </span>
              <span
                className={cn(
                  "text-[11px] transition-colors duration-200",
                  active ? "font-medium text-primary-700 dark:text-primary-400" : "text-foreground-3",
                )}
              >
                {t(f.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemePanel;
