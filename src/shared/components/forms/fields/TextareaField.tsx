import React from "react";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { AlertCircle } from "lucide-react";

export interface TextareaFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
  id?: string;
  className?: string;
  showCharacterCount?: boolean;
  error?: string;
  autoFocus?: boolean;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  value,
  onChange,
  label = "Description",
  placeholder = "Describe this location (optional)",
  maxLength = 500,
  rows = 3,
  required = false,
  id = "location-description",
  className = "",
  showCharacterCount = true,
  error,
  autoFocus = false,
}) => {
  const currentLength = value?.length || 0;
  const isOverLimit = currentLength > maxLength;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-base font-medium">
          {label} {required && "*"}
        </Label>
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
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={`resize-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 h-28 sm:h-auto ${
          error
            ? "border-destructive bg-error-bg focus-visible:ring-error"
            : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
        }`}
        aria-invalid={!!error}
      />
      <div className="h-5">
        {error && (
          <p
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
