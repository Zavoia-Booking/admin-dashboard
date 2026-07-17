import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import { cn } from "../../../../shared/lib/utils";
import {
  hasUnsafeWebsiteCopyCharacters,
  validateWebsiteCopy,
} from "../../../../shared/utils/validation";

/** Shared group label style for section-settings sub-headings. */
export const GROUP_LABEL = "text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3";

/**
 * Always-visible editor for visitor-facing section copy. The resolved built-in copy remains inherited
 * until the owner actually types; a custom value can be explicitly reset without presenting editability
 * as a show/hide switch. Each locale stores its own override, while blank values keep following the
 * translated (and sometimes data-dependent) default.
 */
export function CopyOverride({
  idBase,
  label,
  defaultText,
  value,
  onChange,
  maxLength,
  rows,
  locale,
}: {
  idBase: string;
  label: string;
  defaultText: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows: number;
  /** Active content locale. Edit state never crosses from one locale into the other. */
  locale: "en" | "ro";
}) {
  const { t } = useTranslation(["website", "common"]);
  const [editState, setEditState] = useState<{
    locale: "en" | "ro";
    text: string;
    changed: boolean;
  } | null>(null);
  useEffect(() => setEditState(null), [locale]);
  const activeEdit = editState?.locale === locale ? editState : null;
  const persistedCustom = value.trim() !== "";
  const displayedValue = activeEdit?.text ?? (persistedCustom ? value : defaultText);
  const candidate = activeEdit?.changed ? activeEdit.text : value;
  const candidateTrimmed = candidate.trim();
  const custom = activeEdit?.changed
    ? candidateTrimmed !== "" && candidateTrimmed !== defaultText.trim()
    : persistedCustom;
  const validationError = custom
    ? validateWebsiteCopy(candidate, t, { fieldLabel: label, maxLength })
    : null;
  // Minimum-length guidance waits until blur so the first keystroke is not immediately treated as an
  // error. Markup delimiters are actionable immediately and should never appear valid while typing.
  const error = validationError && (
    !activeEdit ||
    !activeEdit.changed ||
    hasUnsafeWebsiteCopyCharacters(candidate)
  )
    ? validationError
    : undefined;

  const handleFocus = () => {
    if (activeEdit) return;
    setEditState({ locale, text: displayedValue, changed: false });
  };

  const handleChange = (next: string) => {
    setEditState({ locale, text: next, changed: true });
    onChange(next);
  };

  const handleBlur = () => {
    if (!activeEdit) return;
    if (!activeEdit.changed) {
      setEditState(null);
      return;
    }

    const normalized = activeEdit.text.trim();
    if (!normalized || normalized === defaultText.trim()) {
      onChange("");
    } else if (normalized !== activeEdit.text) {
      onChange(normalized);
    }
    setEditState(null);
  };

  const useDefault = () => {
    setEditState(null);
    onChange("");
  };

  return (
    <TextareaField
      id={idBase}
      label={label}
      labelMeta={(
        <span
          className={cn(
            "atelier-copy-source-badge rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold leading-none tracking-[0.08em] transition-[color,background-color,border-color] duration-150",
            custom
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border-subtle bg-surface-hover text-foreground-3",
          )}
        >
          {custom
            ? t("businessPage.builder.settings.copyCustomBadge")
            : t("businessPage.builder.settings.copyDefaultBadge")}
        </span>
      )}
      labelAction={custom ? (
        <button
          type="button"
          onClick={useDefault}
          className="atelier-copy-use-default rounded-md px-1.5 py-1 text-[10.5px] font-semibold text-foreground-3 outline-none transition-[color,background-color,transform] duration-150 hover:bg-surface-hover hover:text-foreground-1 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-focus"
          aria-label={t("businessPage.builder.settings.copyUseDefaultAria", { field: label })}
        >
          {t("businessPage.builder.settings.copyUseDefault")}
        </button>
      ) : undefined}
      value={displayedValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={defaultText}
      rows={rows}
      maxLength={maxLength}
      error={error}
      className="!pt-0"
      textareaClassName={cn(
        "h-auto min-h-0 text-sm leading-relaxed transition-[color,border-color,background-color,box-shadow] duration-150",
        !custom && "text-foreground-2",
      )}
    />
  );
}

export default CopyOverride;
