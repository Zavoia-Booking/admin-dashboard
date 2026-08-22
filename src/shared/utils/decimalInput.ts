/**
 * Sanitiser for free-typed decimal inputs (prices, percentages).
 *
 * Lives outside the field components so the same rule backs every numeric
 * input that reaches a decimal column, and so it can be unit-tested on its own.
 */

/**
 * Widest integer part a price accepts. Prices land in a Postgres `integer`
 * column as minor units (admin-api `service.entity.ts`), which tops out at
 * 2,147,483,647 — so 9,999,999.99 is the largest value that can round-trip
 * safely. Typing stops rather than silently rewriting what the user entered.
 */
export const PRICE_MAX_INTEGER_DIGITS = 7;

/**
 * Reduces anything a keyboard or a paste can produce to the one shape the API
 * accepts: digits, at most one `.`, at most `decimalPlaces` fraction digits.
 *
 * A comma is read as the decimal point, never as a grouping mark. The RO/DE
 * numeric keypads offer `,` and no `.`, so on a phone the canonical form is
 * literally untypable — `12,50` has to mean 12.50.
 *
 * Because the buffer is re-sanitised on every keystroke it never holds more
 * than one separator, so a *typed* second separator is simply refused. A
 * string that arrives with several separators can therefore only have been
 * pasted, and only there is grouping considered — strictly: groups of exactly
 * three digits, optionally closed by a fraction. Anything that isn't that
 * shape keeps the first separator and drops the rest, so `12.12.12` and
 * `100,00.23` resolve to one deterministic price instead of a guess.
 *
 * Examples (decimalPlaces = 2):
 *   `12,50`                       → `12.50`     (1250 minor units)
 *   `12`                          → `12`        (1200 minor units)
 *   `12.`                         → `12.`       (mid-typing, parses as 12)
 *   `12.5678`                     → `12.56`
 *   `1 234,5 lei`                 → `1234.5`
 *   `1,234.56` / `1.234,56`       → `1234.56`   (pasted, grouped)
 *   `1.234.567`                   → `1234567`   (pasted, grouped, no fraction)
 *   `12.12.12`                    → `12.12`
 *   `100,00.23`                   → `100.00`
 *   `12.12.12.112,123,123.12.13`  → `12.12`
 *   `0000000` / `007`             → `0` / `7`   (leading zeros collapsed)
 */
export const sanitizeDecimalInput = (
  raw: string,
  decimalPlaces: number,
  maxIntegerDigits: number = PRICE_MAX_INTEGER_DIGITS,
): string => {
  const digitsAndDots = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");

  // A price has one integer part, not a padded one: `0000000` is `0` and
  // `007` is `7`. Collapsing here keeps the buffer canonical, so what the user
  // reads back is exactly the number that will be submitted.
  const clampWhole = (whole: string) =>
    whole.replace(/^0+(?=\d)/, "").slice(0, maxIntegerDigits);
  const join = (whole: string, fraction: string) =>
    decimalPlaces <= 0
      ? clampWhole(whole)
      : `${clampWhole(whole)}.${fraction.slice(0, decimalPlaces)}`;

  const firstDot = digitsAndDots.indexOf(".");
  if (firstDot === -1) return clampWhole(digitsAndDots);

  const groups = digitsAndDots.split(".");
  if (groups.length > 2) {
    const isGroup = (g: string) => /^\d{3}$/.test(g);
    const tail = groups[groups.length - 1];
    // `1.234.567` — grouping all the way, no fraction.
    if (groups.slice(1).every(isGroup)) return clampWhole(groups.join(""));
    // `1.234.567,89` — grouping closed by a fraction.
    if (
      decimalPlaces > 0 &&
      tail.length >= 1 &&
      tail.length <= decimalPlaces &&
      groups.slice(1, -1).every(isGroup)
    ) {
      return join(groups.slice(0, -1).join(""), tail);
    }
  }

  // One separator, or a shape that isn't grouping: first separator wins and
  // everything after it is fraction.
  return join(
    digitsAndDots.slice(0, firstDot),
    digitsAndDots.slice(firstDot + 1).replace(/\./g, ""),
  );
};
