import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import { FONT_OPTIONS } from "./theme";

interface ThemePanelProps {
  fontKey: string;
  onFontChange: (key: string) => void;
}

/** The font half of the brand theme (brand colour lives in the Branding form — one colour source). A brand
 *  band group: live "Aa" specimens in a row, the active one inked, the rest receded. */
export function ThemePanel({ fontKey, onFontChange }: ThemePanelProps) {
  const { t } = useTranslation("marketplace");
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
        {t("businessPage.theme.fontLabel")}
      </span>
      <div className="grid grid-cols-4 gap-2.5">
        {FONT_OPTIONS.map((f) => {
          const active = fontKey === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onFontChange(f.key)}
              aria-pressed={active}
              aria-label={f.pro ? `${t(f.labelKey)}, ${t("businessPage.pro.badge")}` : undefined}
              className={cn(
                "group/font relative flex flex-col items-start gap-2 rounded-xl border px-3 py-2.5 text-left outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50",
                active
                  ? "border-primary/40 bg-primary/[0.06] shadow-sm dark:bg-primary/[0.10]"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover/60",
              )}
            >
              {f.pro && (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-surface text-foreground-3 ring-1 ring-border"
                >
                  <Lock className="h-2.5 w-2.5" strokeWidth={2.2} />
                </span>
              )}
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
