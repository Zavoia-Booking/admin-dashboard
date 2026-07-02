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
    <div className="flex min-w-0 flex-col justify-center gap-3 rounded-[1.25rem] bg-surface-hover/35 p-4 ring-1 ring-border-subtle">
      <span className="text-[11px] font-semibold uppercase text-foreground-3">
        {t("businessPage.theme.fontLabel")}
      </span>
      <div className="rounded-[1rem] border border-border bg-surface p-1 shadow-xs">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
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
                  "group/font relative flex min-h-[72px] flex-col justify-between rounded-[0.8rem] border px-3 py-2.5 text-left outline-none transition-[transform,border-color,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "border-primary/35 bg-primary/[0.055] shadow-xs dark:bg-primary/[0.10]"
                    : "border-transparent bg-transparent hover:border-border hover:bg-surface-hover/70",
                )}
              >
                {f.pro && (
                  <span
                    aria-hidden
                    className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-surface text-foreground-3 ring-1 ring-border"
                  >
                    <Lock className="size-2.5" strokeWidth={2.2} />
                  </span>
                )}
                <span className="text-[28px] leading-none text-foreground-1" style={{ fontFamily: f.stack }}>
                  Aa
                </span>
                <span
                  className={cn(
                    "truncate text-[11px] transition-colors duration-150 ease-out",
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
    </div>
  );
}

export default ThemePanel;
