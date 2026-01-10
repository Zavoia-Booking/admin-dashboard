import { 
  DollarSign, 
  Euro, 
  PoundSterling, 
  SwissFranc,
  type LucideIcon 
} from "lucide-react";

/**
 * Supported currency codes (ISO 4217 uppercase)
 * All current currencies use 2 decimal places (minor units = 2)
 */
export type CurrencyCode = 
  | 'EUR' | 'USD' | 'RON' | 'GBP' | 'CHF'
  | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK'
  | 'HUF' | 'BGN' | 'HRK' | 'TRY';

/**
 * Currency metadata including display information and minor units
 */
export interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  symbol?: string;
  icon?: LucideIcon;
  minorUnits: 0 | 2 | 3; // Number of decimal places
  selectable: boolean; // false for legacy currencies like HRK
}

/**
 * Currency minor units mapping (ISO 4217 compliant)
 * All current currencies use 2 decimal places
 * Future currencies: JPY=0, BHD/JOD=3
 */
const CURRENCY_MINOR_UNITS: Record<CurrencyCode, 0 | 2 | 3> = {
  EUR: 2, USD: 2, RON: 2, GBP: 2, CHF: 2,
  SEK: 2, NOK: 2, DKK: 2, PLN: 2, CZK: 2,
  HUF: 2, BGN: 2, HRK: 2, TRY: 2,
};

/**
 * Currency metadata for display and formatting
 */
const CURRENCY_METADATA: Record<CurrencyCode, Omit<CurrencyMeta, 'code' | 'minorUnits'>> = {
  EUR: { label: 'Euro', icon: Euro, selectable: true },
  USD: { label: 'US Dollar', icon: DollarSign, selectable: true },
  RON: { label: 'Romanian Leu', symbol: 'lei', selectable: true },
  GBP: { label: 'Pound Sterling', icon: PoundSterling, symbol: '£', selectable: true },
  CHF: { label: 'Swiss Franc', icon: SwissFranc, selectable: true },
  SEK: { label: 'Swedish Krona', symbol: 'kr', selectable: true },
  NOK: { label: 'Norwegian Krone', symbol: 'kr', selectable: true },
  DKK: { label: 'Danish Krone', symbol: 'kr', selectable: true },
  PLN: { label: 'Polish Zloty', symbol: 'zł', selectable: true },
  CZK: { label: 'Czech Koruna', symbol: 'Kč', selectable: true },
  HUF: { label: 'Hungarian Forint', symbol: 'Ft', selectable: true },
  BGN: { label: 'Bulgarian Lev', symbol: 'лв', selectable: true },
  HRK: { label: 'Croatian Kuna (legacy)', symbol: 'kn', selectable: false },
  TRY: { label: 'Turkish Lira', symbol: '₺', selectable: true },
};

/**
 * Normalizes currency code to uppercase ISO format
 * Handles both lowercase ('eur') and uppercase ('EUR') input
 */
function normalizeCurrencyCode(currency: string): CurrencyCode {
  const upper = currency.toUpperCase();
  // Validate it's a known currency, default to EUR if not
  if (upper in CURRENCY_MINOR_UNITS) {
    return upper as CurrencyCode;
  }
  return 'EUR'; // Safe default
}

/**
 * Gets the number of minor units (decimal places) for a currency
 * @param currency - Currency code (case-insensitive)
 * @returns Number of minor units (0, 2, or 3)
 */
export function getCurrencyMinorUnits(currency: string): 0 | 2 | 3 {
  const code = normalizeCurrencyCode(currency);
  return CURRENCY_MINOR_UNITS[code];
}

/**
 * Returns the appropriate icon or symbol to display for a given currency code.
 * Supports all currencies from the CurrencySelect component.
 * 
 * @param currency - The currency code (e.g., 'usd', 'eur', 'gbp') - case-insensitive
 * @returns An object with either an `icon` (LucideIcon) or `symbol` (string) property
 * 
 * @example
 * const display = getCurrencyDisplay('usd');
 * // Returns: { icon: DollarSign }
 * 
 * @example
 * const display = getCurrencyDisplay('eur');
 * // Returns: { icon: Euro }
 */
export const getCurrencyDisplay = (currency: string): { icon?: LucideIcon; symbol?: string } => {
  const code = normalizeCurrencyCode(currency);
  const meta = CURRENCY_METADATA[code];
  
  if (meta.icon) {
    return { icon: meta.icon };
  }
  if (meta.symbol) {
    return { symbol: meta.symbol };
  }
  return { symbol: code };
};

/**
 * Price Storage: Integer Cents (Minor Units)
 * 
 * Industry standard (Stripe, Shopify, etc.) is to store prices as integers
 * in the smallest currency unit (cents for USD/EUR, etc.) to avoid floating-point precision errors.
 * 
 * Example:
 * - User enters: 2.99
 * - Store as: 299 (cents/minor units)
 * - Display: 2.99
 */

/**
 * Converts a display price (e.g., 2.99) to integer minor units (e.g., 299 cents)
 * 
 * This function safely converts decimal prices to integer storage format,
 * avoiding floating-point precision issues by using string-based math.
 * 
 * @param displayPrice - The price as displayed to users (e.g., 2.99)
 * @param currency - Currency code (case-insensitive, e.g., 'eur', 'USD')
 * @returns Integer representing price in minor units (e.g., 299 for 2.99 EUR)
 * 
 * @example
 * priceToStorage(2.99, 'eur') // Returns: 299
 * priceToStorage('12.50', 'usd') // Returns: 1250
 * priceToStorage(0, 'eur') // Returns: 0
 */
export function priceToStorage(displayPrice: number | string, currency: string = 'usd'): number {
  const price = typeof displayPrice === 'string' ? parseFloat(displayPrice) : displayPrice;
  
  if (isNaN(price) || price === 0) {
    return 0;
  }
  
  const minorUnits = getCurrencyMinorUnits(currency);
  const multiplier = Math.pow(10, minorUnits);
  
  // Use Math.round to handle floating-point precision issues
  // For 2 decimal places: Math.round(2.99 * 100) = 299
  return Math.round(price * multiplier);
}

/**
 * Converts integer minor units (e.g., 299 cents) to display format (e.g., 2.99)
 * 
 * @param amountMinor - Price stored as integer minor units (e.g., 299)
 * @param currency - Currency code (case-insensitive, e.g., 'eur', 'USD')
 * @returns Decimal price for display (e.g., 2.99)
 * 
 * @example
 * priceFromStorage(299, 'eur') // Returns: 2.99
 * priceFromStorage(1250, 'usd') // Returns: 12.50
 * priceFromStorage(0, 'eur') // Returns: 0
 */
export function priceFromStorage(amountMinor: number, currency: string = 'usd'): number {
  if (amountMinor === 0 || amountMinor === null || amountMinor === undefined) {
    return 0;
  }
  
  const minorUnits = getCurrencyMinorUnits(currency);
  const divisor = Math.pow(10, minorUnits);
  
  return amountMinor / divisor;
}

