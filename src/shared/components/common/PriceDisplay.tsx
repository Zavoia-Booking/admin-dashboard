import { getCurrencyDisplay } from "../../utils/currency";
import { useFormatPrice } from "../../hooks/useFormatPrice";
import { cn } from "../../lib/utils";

interface PriceDisplayProps {
  /** Amount in minor units (cents). Use this OR `amountDecimal`, not both. */
  amountMinor?: number;
  /** Amount in major units (decimal). Use this OR `amountMinor`, not both. */
  amountDecimal?: number;
  currency: string;
  /** Wrapper class — controls gap and alignment. Defaults to inline flex with gap-1. */
  className?: string;
  /** Icon class — sets size for the Lucide currency icon. */
  iconClassName?: string;
  /** Number/text class — sets font size, weight, and color of the amount. */
  numberClassName?: string;
}

/**
 * Renders a price using the codebase's postfix convention with one nuance:
 *
 * - **Icon currencies** (`USD`/`EUR`/`GBP`/`CHF`): displays the Lucide icon
 *   immediately followed by the bare grouped number — e.g. `<€> 1,234.56`.
 *   The icon is the visual symbol; this matches the conventional prefix-icon
 *   style for character-symbol currencies.
 *
 * - **Text-symbol currencies** (`RON`/`PLN`/`CZK`/`HUF`/`SEK`/`NOK`/`DKK`/
 *   `BGN`/`TRY`/`HRK`): displays the full postfix string from `formatPrice`,
 *   e.g. `1.234,56 lei`. Avoids the awkward `lei 1,234.56` prefix-word render.
 *
 * Use this anywhere you'd otherwise hand-roll the
 * `currencyDisplay.icon ? <Icon /> <span>{val}</span> : <span>{symbol}</span> <span>{val}</span>`
 * pattern. Pass either `amountMinor` (cents — most API data) or
 * `amountDecimal` (major units — form state and computed sums).
 */
export function PriceDisplay({
  amountMinor,
  amountDecimal,
  currency,
  className,
  iconClassName,
  numberClassName,
}: PriceDisplayProps) {
  const {
    formatPrice,
    formatPriceValue,
    formatDecimalPrice,
    formatDecimalValue,
  } = useFormatPrice();
  const currencyDisplay = getCurrencyDisplay(currency);
  const CurrencyIcon = currencyDisplay.icon;
  const useMinor = amountMinor !== undefined;
  const value = useMinor ? (amountMinor as number) : (amountDecimal ?? 0);

  if (CurrencyIcon) {
    const formatted = useMinor
      ? formatPriceValue(value, currency)
      : formatDecimalValue(value, currency);
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <CurrencyIcon className={iconClassName} />
        <span className={numberClassName}>{formatted}</span>
      </span>
    );
  }

  const formatted = useMinor
    ? formatPrice(value, currency)
    : formatDecimalPrice(value, currency);
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span className={numberClassName}>{formatted}</span>
    </span>
  );
}
