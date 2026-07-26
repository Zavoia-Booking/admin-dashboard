import React, { useId } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { AlertCircle, MapPin } from "lucide-react";

export interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  hint?: React.ReactNode; // optional helper rendered directly under the label
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  id?: string;
  className?: string;
  disabled?: boolean;
  /** Optional override icon; pass null for a text-only field. */
  icon?: React.ComponentType<{ className?: string }> | null;
  autoFocus?: boolean;
  type?: 'text' | 'password' | 'email';
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  autoComplete?: string;
  readOnly?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  value,
  onChange,
  error,
  label = "Location Name",
  hint,
  placeholder = "Main Location",
  required = false,
  maxLength = 70,
  id: providedId,
  className = "",
  disabled = false,
  icon,
  autoFocus = false,
  type = "text",
  onKeyDown,
  onFocus,
  onBlur,
  inputRef,
  autoComplete = "off",
  readOnly = false,
}) => {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;
  const Icon = icon === null ? null : icon ?? MapPin;

  return (
    <div className={`space-y-2 ${className} pt-2`}>
      <Label htmlFor={id} className="text-base font-medium">
        {label} {required && "*"}
      </Label>
      {hint}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={type === 'password' ? undefined : maxLength}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          readOnly={readOnly}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`${Icon ? "!pr-11" : ""} transition-[color,background-color,border-color,box-shadow] focus-visible:ring-1 focus-visible:ring-offset-0 ${
            error
              ? "border-destructive bg-error-bg focus-visible:ring-error"
              : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        {Icon ? <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /> : null}
      </div>
      <div className="min-h-5">
        {error && (
          <p
            id={errorId}
            className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default TextField;
