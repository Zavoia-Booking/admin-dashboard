import { useId, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "../../../../shared/components/ui/radio-group";
import { Switch } from "../../../../shared/components/ui/switch";
import { cn } from "../../../../shared/lib/utils";
import type { StripConfig, StripSeparatorStyle } from "../../types";
import { GROUP_LABEL } from "./CopyOverride";
import {
  DEFAULT_STRIP_SEPARATOR_SIZE,
  normalizeStripSeparatorStyle,
  normalizeStripSeparatorSize,
  normalizeStripTextSize,
  STRIP_SEPARATOR_SIZE_MAX,
  STRIP_SEPARATOR_SIZE_MIN,
  STRIP_SEPARATOR_SIZE_STEP,
  STRIP_SEPARATOR_STYLES,
  STRIP_TEXT_SIZE_MAX,
  STRIP_TEXT_SIZE_MIN,
  STRIP_TEXT_SIZE_STEP,
} from "./stripSeparator";
import "./StripEditor.css";

interface StripEditorProps {
  config: StripConfig;
  onConfigChange: (patch: Partial<StripConfig>) => void;
}

function SeparatorPreview({
  style,
  size,
}: {
  style: StripSeparatorStyle;
  size: number;
}) {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center text-primary"
      style={{ transform: `scale(${size / DEFAULT_STRIP_SEPARATOR_SIZE})` }}
      aria-hidden
    >
      <span
        className={cn(
          "block bg-current",
          style === "pearl" && "size-2 rounded-full ring-2 ring-primary/15",
          style === "diamond" && "size-2 rotate-45 rounded-[1px]",
          style === "slash" && "h-4 w-[1.5px] rotate-[18deg] rounded-full",
          style === "sparkle" &&
            "size-3 [clip-path:polygon(50%_0%,61%_39%,100%_50%,61%_61%,50%_100%,39%_61%,0%_50%,39%_39%)]",
          style === "ring" && "size-2.5 rounded-full border-[1.5px] border-current bg-transparent",
        )}
      />
    </span>
  );
}

/** Appearance-only control shared by both Strip motion variants. */
export function StripEditor({ config, onConfigChange }: StripEditorProps) {
  const { t } = useTranslation("website");
  const titleId = useId();
  const sizeId = useId();
  const sizeHintId = useId();
  const textSizeId = useId();
  const textSizeHintId = useId();
  const separatorStyle = normalizeStripSeparatorStyle(config.separatorStyle);
  const separatorSize = normalizeStripSeparatorSize(config.separatorSize);
  const textSize = normalizeStripTextSize(config.textSize);
  const useBrandColorBackground = config.useBrandColorBackground === true;
  const separatorSliderProgress =
    ((separatorSize - STRIP_SEPARATOR_SIZE_MIN)
      / (STRIP_SEPARATOR_SIZE_MAX - STRIP_SEPARATOR_SIZE_MIN))
    * 100;
  const textSliderProgress =
    ((textSize - STRIP_TEXT_SIZE_MIN) / (STRIP_TEXT_SIZE_MAX - STRIP_TEXT_SIZE_MIN)) * 100;

  return (
    <div>
      <span id={titleId} className={GROUP_LABEL}>
        {t("businessPage.builder.settings.stripSeparator.title")}
      </span>
      <p className="mt-1 text-[12px] leading-5 text-foreground-3">
        {t("businessPage.builder.settings.stripSeparator.hint")}
      </p>

      <RadioGroup
        value={separatorStyle}
        onValueChange={(value) =>
          onConfigChange({ separatorStyle: normalizeStripSeparatorStyle(value) })
        }
        aria-labelledby={titleId}
        className="mt-3 grid grid-cols-2 gap-2"
      >
        {STRIP_SEPARATOR_STYLES.map((style) => {
          return (
            <RadioGroupItem
              key={style}
              value={style}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 text-left text-[12.5px] font-medium text-foreground-2 outline-none transition-[border-color,background-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-border-strong hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98]",
                "data-[state=checked]:border-black data-[state=checked]:bg-primary/5 data-[state=checked]:text-foreground-1 data-[state=checked]:shadow-sm",
              )}
            >
              <SeparatorPreview style={style} size={separatorSize} />
              <span className="min-w-0 flex-1">
                {t(`businessPage.builder.settings.stripSeparator.options.${style}`)}
              </span>
            </RadioGroupItem>
          );
        })}
      </RadioGroup>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor={sizeId} className={GROUP_LABEL}>
              {t("businessPage.builder.settings.stripSeparator.size.title")}
            </label>
            <p id={sizeHintId} className="mt-1 text-[12px] leading-5 text-foreground-3">
              {t("businessPage.builder.settings.stripSeparator.size.hint")}
            </p>
          </div>
          <output
            htmlFor={sizeId}
            className="mt-0.5 min-w-[3.5rem] shrink-0 rounded-full border border-border bg-surface-hover px-2.5 py-1 text-center text-[12px] font-semibold tabular-nums text-foreground-1"
          >
            {separatorSize}%
          </output>
        </div>

        <input
          id={sizeId}
          className="strip-size-slider mt-2"
          type="range"
          min={STRIP_SEPARATOR_SIZE_MIN}
          max={STRIP_SEPARATOR_SIZE_MAX}
          step={STRIP_SEPARATOR_SIZE_STEP}
          value={separatorSize}
          onChange={(event) =>
            onConfigChange({
              separatorSize: normalizeStripSeparatorSize(event.currentTarget.valueAsNumber),
            })
          }
          aria-describedby={sizeHintId}
          aria-valuetext={t("businessPage.builder.settings.stripSeparator.size.value", {
            value: separatorSize,
          })}
          style={{ "--strip-slider-progress": `${separatorSliderProgress}%` } as CSSProperties}
        />
        <div
          className="-mt-1 flex justify-between text-[11px] font-medium text-foreground-3"
          aria-hidden
        >
          <span>{t("businessPage.builder.settings.stripSeparator.size.subtle")}</span>
          <span>{t("businessPage.builder.settings.stripSeparator.size.bold")}</span>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor={textSizeId} className={GROUP_LABEL}>
              {t("businessPage.builder.settings.stripSeparator.textSize.title")}
            </label>
            <p id={textSizeHintId} className="mt-1 text-[12px] leading-5 text-foreground-3">
              {t("businessPage.builder.settings.stripSeparator.textSize.hint")}
            </p>
          </div>
          <output
            htmlFor={textSizeId}
            className="mt-0.5 min-w-[3.5rem] shrink-0 rounded-full border border-border bg-surface-hover px-2.5 py-1 text-center text-[12px] font-semibold tabular-nums text-foreground-1"
          >
            {textSize}%
          </output>
        </div>

        <input
          id={textSizeId}
          className="strip-size-slider mt-2"
          type="range"
          min={STRIP_TEXT_SIZE_MIN}
          max={STRIP_TEXT_SIZE_MAX}
          step={STRIP_TEXT_SIZE_STEP}
          value={textSize}
          onChange={(event) =>
            onConfigChange({
              textSize: normalizeStripTextSize(event.currentTarget.valueAsNumber),
            })
          }
          aria-describedby={textSizeHintId}
          aria-valuetext={t("businessPage.builder.settings.stripSeparator.textSize.value", {
            value: textSize,
          })}
          style={{ "--strip-slider-progress": `${textSliderProgress}%` } as CSSProperties}
        />
        <div
          className="-mt-1 flex justify-between text-[11px] font-medium text-foreground-3"
          aria-hidden
        >
          <span>{t("businessPage.builder.settings.stripSeparator.textSize.smaller")}</span>
          <span>{t("businessPage.builder.settings.stripSeparator.textSize.larger")}</span>
        </div>
      </div>

      <div className="mt-6 flex items-start justify-between gap-4 border-t border-border pt-5">
        <div className="min-w-0">
          <span className={GROUP_LABEL}>
            {t("businessPage.builder.settings.stripSeparator.background.title")}
          </span>
          <p className="mt-1 text-[12px] leading-5 text-foreground-3">
            {t("businessPage.builder.settings.stripSeparator.background.hint")}
          </p>
        </div>
        <Switch
          checked={useBrandColorBackground}
          onCheckedChange={(checked) => onConfigChange({ useBrandColorBackground: checked })}
          aria-label={t("businessPage.builder.settings.stripSeparator.background.toggle")}
        />
      </div>
    </div>
  );
}

export default StripEditor;
