import React from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { AlertCircle, MapPin, Monitor } from "lucide-react";

export interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  isRemote?: boolean;
  required?: boolean;
  maxLength?: number;
  id?: string;
  className?: string;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>; // optional override icon
  type?: 'text' | 'password' | 'email';
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const TextField: React.FC<TextFieldProps> = ({
  value,
  onChange,
  error,
  label = "Location Name",
  placeholder = "Main Location",
  isRemote = false,
  required = false,
  maxLength = 70,
  id = "location-name",
  className = "",
  disabled = false,
  icon,
  type = "text",
  onKeyDown,
  inputRef,
}) => {
  const Icon = icon ?? (isRemote ? Monitor : MapPin);
  const displayLabel =
    isRemote && label === "Location Name" ? "Online Location Name" : label;

  return (
    <div className={`space-y-2 ${className} pt-2`}>
      <Label htmlFor={id} className="text-base font-medium">
        {displayLabel} {required && "*"}
      </Label>
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
          onKeyDown={onKeyDown}
          className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
            error
              ? "border-destructive bg-error-bg focus-visible:ring-error"
              : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
          }`}
          aria-invalid={!!error}
        />
        <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      </div>
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

export default TextField;
