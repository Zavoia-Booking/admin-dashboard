import { type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../../shared/lib/utils";
import { FONT_OPTIONS } from "./theme";

interface ThemePanelProps {
  fontKey: string;
  onFontChange: (key: string) => void;
}

/** The font half of the brand theme (brand colour lives in the Branding form — one colour source). A brand
 *  band group: live "Aa" specimens in a row, the active one inked, the rest receded. Radiogroup semantics
 *  with roving tabindex — one Tab stop, arrows move (and apply) the selection, like the colour swatches. */
export function ThemePanel({ fontKey, onFontChange }: ThemePanelProps) {
  const { t } = useTranslation("marketplace");

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const current = FONT_OPTIONS.findIndex((f) => f.key === fontKey);
    let next: number;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = FONT_OPTIONS.length - 1;
    else {
      const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      next = ((current < 0 ? 0 : current) + delta + FONT_OPTIONS.length) % FONT_OPTIONS.length;
    }
    const target = FONT_OPTIONS[next];
    if (!target) return;
    onFontChange(target.key);
    e.currentTarget
      .querySelector<HTMLButtonElement>(`[data-font-option="${target.key}"]`)
      ?.focus();
  };

  return (
    <div className="space-y-2.5">
      <span id="website-font-group-label" className="text-[11px] font-semibold uppercase text-foreground-3">
        {t("businessPage.theme.fontLabel")}
      </span>
      <div className="rounded-xl border border-border bg-surface p-1">
        <div
          role="radiogroup"
          aria-labelledby="website-font-group-label"
          onKeyDown={handleKeyDown}
          className="grid grid-cols-2 gap-1 sm:grid-cols-4"
        >
          {FONT_OPTIONS.map((f, i) => {
            const active = fontKey === f.key;
            const hasSelection = FONT_OPTIONS.some((o) => o.key === fontKey);
            const tabbable = active || (!hasSelection && i === 0);
            return (
              <button
                key={f.key}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={tabbable ? 0 : -1}
                data-font-option={f.key}
                onClick={() => onFontChange(f.key)}
                className={cn(
                  "group/font relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center outline-none transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "border-primary/35 bg-primary/[0.055] dark:bg-primary/[0.10]"
                    : "border-transparent bg-transparent hover:border-border hover:bg-surface-hover/70",
                )}
              >
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
