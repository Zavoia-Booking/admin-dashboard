import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { AlertCircle } from "lucide-react";
import type { NumberFieldProps } from "./NumberField";
import { priceToStorage, priceFromStorage, formatPriceValue } from "../../../utils/currency";
import { resolveIntlLocale } from "../../../hooks/useFormatPrice";

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
 * - Locale-aware thousands grouping (`1,234.56` on EN, `1.234,56` on RO)
 * - Locale-aware decimal separator: users can type / paste either form;
 *   the normalizer interprets dots vs commas based on the active locale
 *   and produces canonical dot-decimal for storage
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
  hideInlineError = false,
  currency = "usd",
  storageFormat = "cents", // Default to 'cents' - prices are stored as integer minor units
  liveUpdate = false, // When true, calls onChange on every keystroke
}) => {
  const { i18n } = useTranslation();
  const locale = resolveIntlLocale(i18n.language);
  // Detect which char this locale uses as the decimal separator. Anything
  // else (between digits) is treated as a thousands separator and stripped
  // by the normalizer below. Memoized to avoid creating an Intl instance
  // on every render.
  const decimalSeparator = useMemo<"." | ",">(
    () => (new Intl.NumberFormat(locale).format(1.1).includes(",") ? "," : "."),
    [locale],
  );
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

  // Display formatted value when not focused, raw input when focused.
  // Formatting goes through the shared currency util so PriceField inputs,
  // dashboard widgets, and badges all render the same grouped, locale-aware
  // number — no more "12,321,699.00 in the input, 699.00 in the badge"
  // mismatches.
  const displayValue = isFocused
    ? localInputValue
    : displayValueNum === 0
    ? ""
    : formatPriceValue(displayValueNum, currency, { locale, decimalPlaces });

  /**
   * Normalizes input to canonical dot-decimal so `parseFloat` can read it.
   *
   * Strategy: whatever char this locale uses as the *decimal* separator
   * survives (converted to `.` if needed); the *other* char is treated as
   * a thousands grouping and stripped.
   *
   * Examples (RO locale, decimal = `,`):
   *   `12.321.699,50`  → `12321699.50`
   *   `1234,5`         → `1234.5`
   *   `1234.5`         → `12345` (dots are thousands here; matches RO convention)
   *
   * Examples (EN locale, decimal = `.`):
   *   `12,321,699.50`  → `12321699.50`
   *   `1234.5`         → `1234.5`
   *   `1234,5`         → `12345` (commas are thousands)
   */
  const normalizeDecimalInput = (input: string): string => {
    const cleaned = input.replace(/\s/g, "");
    if (decimalSeparator === ",") {
      // RO-style: dots are thousands separators, comma is decimal.
      return cleaned.replace(/\./g, "").replace(/,/g, ".");
    }
    // EN-style: commas are thousands separators, dot is decimal.
    return cleaned.replace(/,/g, "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow free typing AND pasting of locale-formatted values while
    // focused. The blur normalizer (or liveUpdate path) cleans it up.
    // Only constraint: digits, dots, commas, whitespace. No letters, no
    // sign characters (prices can't be negative).
    const isValidInput =
      inputValue === "" || /^[\d.,\s]*$/.test(inputValue);

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
    // Initialize the editable buffer with an *unformatted* value rendered
    // in the locale's decimal style so it matches what the user just saw
    // (e.g. RO user blurs to see `12.321.699,50`, focuses to edit
    // `12321699,50` — same separator they're used to typing).
    let currentDisplay = "";
    if (displayValueNum !== 0) {
      const canonical = String(displayValueNum);
      currentDisplay =
        decimalSeparator === "," ? canonical.replace(".", ",") : canonical;
    }
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
