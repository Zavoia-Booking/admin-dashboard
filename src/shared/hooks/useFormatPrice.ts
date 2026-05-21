import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatPriceMinor,
  formatPriceValueMinor,
  formatPrice as formatPriceUtil,
  formatPriceValue as formatPriceValueUtil,
  type PriceFormatOptions,
} from '../utils/currency';

/**
 * Map an i18next language code (`'en'`, `'ro'`, `'en-US'`, …) to a BCP-47
 * tag suitable for `Intl.NumberFormat`. Anything we don't recognize falls
 * back to `'en-US'` so output stays predictable.
 *
 * Exported so non-React contexts (e.g. PDF exporters) can derive the same
 * locale without depending on the hook.
 */
export function resolveIntlLocale(language: string | undefined): string {
  if (!language) return 'en-US';
  const lower = language.toLowerCase();
  if (lower.startsWith('ro')) return 'ro-RO';
  if (lower.startsWith('en')) return 'en-US';
  // Already a BCP-47 tag? Trust it. Intl will reject it gracefully.
  return language;
}

/**
 * Locale-aware price formatters bound to the user's active i18n language.
 *
 * Two input formats:
 * - `formatPrice` / `formatPriceValue` — accept *cents* (integer minor
 *   units). This is the most common path; API data is stored as cents.
 * - `formatDecimalPrice` / `formatDecimalValue` — accept a decimal value
 *   (e.g. `12321699`). Use for form inputs and other surfaces that work
 *   in display units.
 *
 * Two output shapes:
 * - `*Price` — full string with our friendly symbol (e.g. `'12,321,699.00 lei'`).
 *   Use when the symbol is rendered as text.
 * - `*Value` — just the grouped number (e.g. `'12,321,699.00'`). Use when a
 *   Lucide currency icon is rendered alongside the number (EUR/USD/GBP/CHF).
 *
 * @example
 * const { formatPrice, formatPriceValue } = useFormatPrice();
 * formatPrice(1232169900, 'RON');       // '12,321,699.00 lei' (EN) / '12.321.699,00 lei' (RO)
 * formatPriceValue(69900, 'EUR');       // '699.00' — render next to <Euro /> icon
 */
export function useFormatPrice() {
  const { i18n } = useTranslation();
  const locale = resolveIntlLocale(i18n.language);

  const formatPrice = useCallback(
    (amountMinor: number, currency: string, opts?: PriceFormatOptions) =>
      formatPriceMinor(amountMinor, currency, { locale, ...opts }),
    [locale],
  );

  const formatPriceValue = useCallback(
    (amountMinor: number, currency: string, opts?: PriceFormatOptions) =>
      formatPriceValueMinor(amountMinor, currency, { locale, ...opts }),
    [locale],
  );

  const formatDecimalPrice = useCallback(
    (value: number, currency: string, opts?: PriceFormatOptions) =>
      formatPriceUtil(value, currency, { locale, ...opts }),
    [locale],
  );

  const formatDecimalValue = useCallback(
    (value: number, currency: string, opts?: PriceFormatOptions) =>
      formatPriceValueUtil(value, currency, { locale, ...opts }),
    [locale],
  );

  return useMemo(
    () => ({
      formatPrice,
      formatPriceValue,
      formatDecimalPrice,
      formatDecimalValue,
      locale,
    }),
    [formatPrice, formatPriceValue, formatDecimalPrice, formatDecimalValue, locale],
  );
}
