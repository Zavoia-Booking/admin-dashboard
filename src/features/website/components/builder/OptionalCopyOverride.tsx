import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import { Badge } from "../../../../shared/components/ui/badge";
import { cn } from "../../../../shared/lib/utils";
import {
  hasUnsafeWebsiteCopyCharacters,
  validateWebsiteCopy,
} from "../../../../shared/utils/validation";

/**
 * Default / custom / blank copy editor for fields whose inherited text may be removed.
 *
 * `blank` is deliberately separate from an empty override: old drafts with no override keep inheriting
 * the translated default, while clearing the visible textarea records an explicit blank state. Restoring
 * the default is therefore an intentional action instead of an automatic side effect of blur.
 */
export function OptionalCopyOverride({
  idBase,
  label,
  defaultText,
  value,
  blank,
  onChange,
  onBlankChange,
  maxLength,
  rows,
  locale,
  required = false,
  requiredMessage,
  externalError,
}: {
  idBase: string;
  label: string;
  defaultText: string;
  value: string;
  blank: boolean;
  onChange: (value: string) => void;
  onBlankChange: (blank: boolean) => void;
  maxLength: number;
  rows: number;
  locale: "en" | "ro";
  required?: boolean;
  requiredMessage?: string;
  /** Save-blocking validation is already authoritative and must not wait for local blur state. */
  externalError?: string;
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
  const displayedValue = activeEdit?.text ?? (blank ? "" : persistedCustom ? value : defaultText);
  const candidate = activeEdit?.changed ? activeEdit.text : blank ? "" : value;
  const candidateTrimmed = candidate.trim();
  const state = activeEdit?.changed
    ? candidateTrimmed === ""
      ? "blank"
      : candidateTrimmed === defaultText.trim()
        ? "default"
        : "custom"
    : blank
      ? "blank"
      : persistedCustom
        ? "custom"
        : "default";
  const validationError = state === "custom"
    ? validateWebsiteCopy(candidate, t, { fieldLabel: label, maxLength })
    : null;
  const customError = validationError && (
    !activeEdit ||
    !activeEdit.changed ||
    hasUnsafeWebsiteCopyCharacters(candidate)
  )
    ? validationError
    : undefined;
  const localError = state === "blank" && required
    ? requiredMessage ?? t("common:validation.required", { field: label })
    : customError;
  const error = externalError ?? localError;

  const handleFocus = () => {
    if (activeEdit) return;
    setEditState({ locale, text: displayedValue, changed: false });
  };

  const handleChange = (next: string) => {
    setEditState({ locale, text: next, changed: true });
    const nextBlank = next.trim() === "";
    // Discrete input events normally flush the parent patch before the next keystroke, but writing
    // the explicit state every time also keeps rapid delete/retype sequences correct under batching.
    onBlankChange(nextBlank);
    onChange(next);
  };

  const handleBlur = () => {
    if (!activeEdit) return;
    if (!activeEdit.changed) {
      setEditState(null);
      return;
    }

    const normalized = activeEdit.text.trim();
    if (!normalized) {
      onChange("");
      onBlankChange(true);
    } else if (normalized === defaultText.trim()) {
      onChange("");
      onBlankChange(false);
    } else {
      onBlankChange(false);
      if (normalized !== activeEdit.text) onChange(normalized);
    }
    setEditState(null);
  };

  const restoreDefault = () => {
    setEditState(null);
    onChange("");
    onBlankChange(false);
  };

  return (
    <TextareaField
      id={idBase}
      label={label}
      required={required}
      hint={(
        <Badge
          variant="secondary"
          className={cn(
            "self-start shrink-0 rounded-full font-medium",
            state === "custom"
              ? "gap-1.5 border-purple-200 bg-purple-50 px-2 py-0.5 text-xs hover:bg-purple-50"
              : state === "blank"
                ? "border-border bg-surface-hover px-2.5 py-0.5 text-[11px] text-foreground-3 hover:bg-surface-hover"
                : "border-border bg-info/20 px-2.5 py-0.5 text-[11px] text-foreground-3 hover:bg-info/20 dark:border-border-subtle dark:bg-info/60 dark:hover:bg-info/60",
          )}
        >
          {state === "custom" ? <span className="size-2 rounded-full bg-purple-500" aria-hidden /> : null}
          <span className={state === "custom" ? "text-neutral-900" : undefined}>
            {state === "custom"
              ? t("businessPage.builder.settings.copyCustomBadge")
              : state === "blank"
                ? t("businessPage.builder.settings.copyBlankBadge")
                : t("businessPage.builder.settings.copyDefaultBadge")}
          </span>
        </Badge>
      )}
      labelAction={state !== "default" ? (
        <button
          type="button"
          onClick={restoreDefault}
          className="atelier-copy-use-default rounded-md px-1.5 py-1 text-[10.5px] font-semibold text-foreground-3 outline-none transition-[color,background-color,transform] duration-150 hover:bg-surface-hover hover:text-foreground-1 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-focus"
          aria-label={t("businessPage.builder.settings.copyRestoreDefaultAria", { field: label })}
        >
          {t("businessPage.builder.settings.copyRestoreDefault")}
        </button>
      ) : undefined}
      value={displayedValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={state === "blank"
        ? t("businessPage.builder.settings.copyBlankPlaceholder")
        : defaultText}
      rows={rows}
      maxLength={maxLength}
      showCharacterCount
      error={error}
      className="!pt-0"
      textareaClassName={cn(
        "h-auto min-h-0 text-sm leading-relaxed transition-[color,border-color,background-color,box-shadow] duration-150",
        state !== "custom" && "text-foreground-2",
      )}
    />
  );
}

export default OptionalCopyOverride;
