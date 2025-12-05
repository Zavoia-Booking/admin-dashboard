import React, { useState } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { AlertCircle } from "lucide-react";
import type { NumberFieldProps } from "./NumberField";
import { priceToStorage, priceFromStorage } from "../../../utils/currency";

export interface PriceFieldProps
  extends Omit<NumberFieldProps, "onChange" | "value"> {
  value: number | string; // Storage format (cents/integer) or display format (decimal) - see storageFormat prop
  onChange: (value: number | string) => void;
  decimalPlaces?: number; // Number of decimal places (default: 2 for prices)
  currency?: string; // Currency code for conversion (default: 'usd')
  storageFormat?: "cents" | "decimal"; // Storage format: 'cents' (299) or 'decimal' (2.99) - default: 'decimal' for backward compatibility
  customLabelClassName?: string; // Optional override for label typography
  liveUpdate?: boolean; // If true, calls onChange on every keystroke (useful for real-time price calculations)
}

/**
 * Formats a number to display with thousand separators and specified decimal places
 */
const formatPrice = (value: number | string, decimalPlaces: number): string => {
  if (value === "" || value === null || value === undefined) return "";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";

  // Format with thousand separators and specified decimal places
  return numValue.toLocaleString("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

/**
 * PriceField component - extends NumberField with price-specific formatting
 *
 * 2025 SaaS Best Practice: Supports both storage formats
 * - 'cents' (recommended): Store as integer (299 cents = $2.99) - avoids floating point errors
 * - 'decimal': Store as decimal (2.99) - simpler but can have precision issues
 *
 * Features:
 * - Right-aligned numeric text
 * - Thousand separators (commas)
 * - Decimal formatting (default: 2 decimal places)
 * - Format on blur, raw value when focused
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

  // Display formatted value when not focused, raw input when focused
  const displayValue = isFocused
    ? localInputValue
    : displayValueNum === 0
    ? ""
    : formatPrice(displayValueNum, decimalPlaces);

  /**
   * Normalizes input to standard format (dot as decimal separator)
   * Best Practice: Force dot (.) as decimal separator only
   * This ensures unambiguous parsing and matches industry standards for admin interfaces.
   */
  const normalizeDecimalInput = (input: string): string => {
    const cleaned = input.replace(/\s/g, "");
    return cleaned.replace(/,/g, "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow free typing while focused - just store the raw input
    // Only allow dot (.) as decimal separator - block commas
    // Prevent negative numbers for prices (min >= 0)
    // Valid patterns: "123", "123.45"
    const isValidInput =
      inputValue === "" || inputValue === "." || /^\d*\.?\d*$/.test(inputValue); // Only digits and one dot

    if (isValidInput) {
      setLocalInputValue(inputValue);

      // If liveUpdate is enabled, call onChange immediately
      if (liveUpdate) {
        const normalized = normalizeDecimalInput(inputValue);
        const parsed = parseFloat(normalized);

        if (!isNaN(parsed) && normalized !== "") {
          const safeValue = Math.max(0, parsed);
          if (storageFormat === "cents") {
            const storageValue = priceToStorage(safeValue, currency);
            onChange(storageValue);
          } else {
            onChange(safeValue);
          }
        } else if (normalized === "" || normalized === ".") {
          onChange(storageFormat === "cents" ? 0 : 0);
        }
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Initialize local input value with the current display value (without formatting)
    const currentDisplay = displayValueNum === 0 ? "" : String(displayValueNum);
    setLocalInputValue(currentDisplay);
    // Select all text on focus for easier editing
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Normalize the input (handle comma as decimal separator)
    const normalized = normalizeDecimalInput(localInputValue);
    const parsed = parseFloat(normalized);

    if (!isNaN(parsed) && normalized !== "") {
      // Ensure non-negative (prices can't be negative)
      const safeValue = Math.max(0, parsed);

      // Convert to storage format
      if (storageFormat === "cents") {
        const storageValue = priceToStorage(safeValue, currency);
        onChange(storageValue);
      } else {
        onChange(safeValue);
      }
    } else if (normalized === "") {
      // Empty - set to 0
      onChange(storageFormat === "cents" ? 0 : 0);
    }

    // Clear local input value
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

export default PriceField;
