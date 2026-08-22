import React, { useState } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { AlertCircle } from "lucide-react";
import type { NumberFieldProps } from "./NumberField";
import { priceToStorage, priceFromStorage } from "../../../utils/currency";
import { sanitizeDecimalInput } from "../../../utils/decimalInput";

export interface PriceFieldProps
  extends Omit<NumberFieldProps, "onChange" | "value"> {
  value: number | string; // Storage format (cents/integer) or display format (decimal) - see storageFormat prop
  onChange: (value: number | string) => void;
  decimalPlaces?: number; // Number of decimal places (default: 2 for prices)
  currency?: string; // Currency code for conversion (default: 'usd')
  storageFormat?: "cents" | "decimal"; // Storage format: 'cents' (299) or 'decimal' (2.99) - default: 'decimal' for backward compatibility
  customLabelClassName?: string; // Optional override for label typography
  liveUpdate?: boolean; // If true, calls onChange on every keystroke (useful for real-time price calculations)
  hideInlineError?: boolean; // If true, hide the inline error message
}

/**
 * PriceField component - extends NumberField with price-specific formatting
 *
 * 2025 SaaS Best Practice: Supports both storage formats
 * - 'cents' (recommended): Store as integer (299 cents = $2.99) - avoids floating point errors
 * - 'decimal': Store as decimal (2.99) - simpler but can have precision issues
 *
 * Features:
 * - Right-aligned numeric text
 * - One canonical format everywhere — plain dot-decimal, no thousands
 *   grouping — so what the field shows is exactly what it accepts. A comma
 *   typed on a RO/DE numeric keypad is read as the decimal point.
 * - Input is sanitised as it is typed (see {@link sanitizeDecimalInput}); the
 *   field cannot be made to hold a malformed price.
 * - Padded to `decimalPlaces` on blur, raw buffer while focused
 * - Auto-select on focus for easier editing
 * - Mobile-friendly decimal keyboard
 * - Automatic conversion between display and storage formats
 */
export const PriceField: React.FC<PriceFieldProps> = ({
  value,
  onChange,
  error,
  label,
  customLabelClassName,
  placeholder,
  required = false,
  min,
  max,
  step = 0.01,
  id,
  className = "",
  icon: Icon,
  symbol,
  iconPosition = "left",
  helpText,
  decimalPlaces = 2,
  hideInlineError = false,
  currency = "usd",
  storageFormat = "cents", // Default to 'cents' - prices are stored as integer minor units
  liveUpdate = false, // When true, calls onChange on every keystroke
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localInputValue, setLocalInputValue] = useState<string>("");
  const hasIcon = !!Icon;
  const hasSymbol = !!symbol;
  const hasPrefix = hasIcon || hasSymbol;
  const iconPadding = hasPrefix
    ? iconPosition === "left"
      ? "!pl-10"
      : "!pr-11"
    : "";

  // Convert storage format to display format
  const getDisplayValue = (): number => {
    if (value === "" || value === null || value === undefined) return 0;
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return 0;

    if (storageFormat === "cents") {
      return priceFromStorage(numValue, currency);
    }
    return numValue;
  };

  const displayValueNum = getDisplayValue();

  // Blurred: the same canonical dot-decimal the field accepts, just padded to
  // `decimalPlaces`. Deliberately NOT locale-grouped — a field that reads
  // `1.234,50` but only takes `1234.50` is a trap, and on RO the old grouping
  // made a typed `12.50` mean 1250. Grouped, locale-aware output still belongs
  // on read-only surfaces (badges, widgets) via formatPrice*.
  const displayValue = isFocused
    ? localInputValue
    : displayValueNum === 0
    ? ""
    : displayValueNum.toFixed(decimalPlaces);

  /** Pushes the buffer out in whichever storage format the caller asked for. */
  const commit = (buffer: string) => {
    const parsed = parseFloat(buffer);
    // NaN covers "" and a lone "." — both mean "no price yet".
    const safeValue = isNaN(parsed) ? 0 : Math.max(0, parsed);
    onChange(
      storageFormat === "cents"
        ? priceToStorage(safeValue, currency)
        : safeValue,
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitise on the way in rather than validating on the way out: the field
    // only ever holds a well-formed price, so there is no malformed state for
    // a blur, a submit, or a `liveUpdate` consumer to read.
    const sanitized = sanitizeDecimalInput(e.target.value, decimalPlaces);
    setLocalInputValue(sanitized);
    if (liveUpdate) commit(sanitized);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Editable buffer = the value without the blur padding, in the same
    // canonical form the field accepts (`12.5`, not `12.50` or `12,50`).
    setLocalInputValue(displayValueNum === 0 ? "" : String(displayValueNum));
    // Select all text on focus for easier editing
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // The buffer is already canonical, so blur only has to publish it.
    commit(localInputValue);
    setLocalInputValue("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label
          htmlFor={id}
          className={customLabelClassName || "text-base font-medium"}
        >
          {label} {required && "*"}
        </Label>
      )}
      <div className="relative">
        {iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {Icon ? (
              <Icon className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
            ) : symbol ? (
              <span className="text-sm font-medium text-foreground-3 dark:text-foreground-2">
                {symbol}
              </span>
            ) : null}
          </div>
        )}
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className={`${iconPadding} text-right transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
            error
              ? "border-destructive bg-error-bg focus-visible:ring-error"
              : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
          }`}
          aria-invalid={!!error}
        />
        {iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {Icon ? (
              <Icon className="h-4 w-4 text-primary" />
            ) : symbol ? (
              <span className="text-sm font-medium text-primary">{symbol}</span>
            ) : null}
          </div>
        )}
      </div>
      {helpText && !error && (
        <p className="text-xs text-foreground-3 dark:text-foreground-2">
          {helpText}
        </p>
      )}
      {!hideInlineError && <div className="min-h-5">
        {error && (
          <p
            className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>}
    </div>
  );
};

export default PriceField;
