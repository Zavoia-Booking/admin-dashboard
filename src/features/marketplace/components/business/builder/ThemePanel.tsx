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
    <div className="space-y-2.5">
      <span className="text-[11px] font-semibold uppercase text-foreground-3">
        {t("businessPage.theme.fontLabel")}
      </span>
      <div className="rounded-xl border border-border bg-surface p-1">
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
                  "group/font relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center outline-none transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "border-primary/35 bg-primary/[0.055] dark:bg-primary/[0.10]"
                    : "border-transparent bg-transparent hover:border-border hover:bg-surface-hover/70",
                )}
              >
                {f.pro && (
                  <span
                    aria-hidden
                    className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-surface text-foreground-3 ring-1 ring-border"
                  >
                    <Lock className="size-2.5" strokeWidth={2.2} />
                  </span>
                )}
                <span className="shrink-0 text-[21px] leading-none text-foreground-1" style={{ fontFamily: f.stack }}>
                  Aa
                </span>
                <span
                  className={cn(
                    "max-w-full truncate text-[11px] leading-none transition-colors duration-150 ease-out",
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
