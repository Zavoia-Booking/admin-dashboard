import React from "react";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { AlertCircle } from "lucide-react";

export interface TextareaFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Compact status displayed beside the label, such as Default / Custom. */
  labelMeta?: React.ReactNode;
  /** Optional field-level action displayed beside the counter, such as Use default. */
  labelAction?: React.ReactNode;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
  id?: string;
  className?: string;
  showCharacterCount?: boolean;
  error?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  helperText?: string;
  /** Rich helper rendered under the label (above the textarea), e.g. a required/info cue. Mirrors TextField. */
  hint?: React.ReactNode;
  disabled?: boolean;
  textareaClassName?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  value,
  onChange,
  label = "Description",
  labelMeta,
  labelAction,
  placeholder = "Describe this location (optional)",
  maxLength = 500,
  rows = 3,
  required = false,
  id = "location-description",
  className = "",
  showCharacterCount = true,
  error,
  autoFocus = false,
  onFocus,
  onBlur,
  helperText,
  hint,
  disabled = false,
  textareaClassName = "",
}) => {
  const currentLength = value?.length || 0;
  const isOverLimit = currentLength > maxLength;
  const errorId = `${id}-error`;

  return (
    <div className={`space-y-2 pt-2 ${className}`}>
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Label htmlFor={id} className="text-base font-medium">
              {label} {required && "*"}
            </Label>
            {labelMeta}
          </div>
          {(labelAction || showCharacterCount) && (
            <div className="flex shrink-0 items-center gap-2">
              {labelAction}
              {showCharacterCount && (
                <span
                  className={`text-xs ${
                    isOverLimit
                      ? "text-error"
                      : "text-foreground-3 dark:text-foreground-2"
                  }`}
                >
                  {currentLength}/{maxLength}
                </span>
              )}
            </div>
          )}
        </div>
        {helperText && (
          <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
            {helperText}
          </p>
        )}
        {hint}
      </div>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        autoComplete="off"
        disabled={disabled}
        className={`resize-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 h-28 sm:h-auto ${
          error
            ? "border-destructive bg-error-bg focus-visible:ring-error"
            : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
        } ${textareaClassName}`}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      <div className="h-5">
        {error && (
          <p
            id={errorId}
            className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default TextareaField;
