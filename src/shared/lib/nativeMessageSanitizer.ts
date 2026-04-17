import config from '../../app/config/env';
import i18n from './i18n';

/**
 * Words and phrases that must never appear in any user-visible string on native
 * builds (Apple Guideline 3.1.1 / 3.1.3(a) and Google Play equivalents).
 *
 * Kept in lower-case; matching is case-insensitive. Anchored with word boundaries
 * via the regex below — we deliberately don't catch fragments like "subordinate"
 * (which contains "sub"). If a banned phrase is multi-word, list it verbatim.
 */
const NATIVE_BANNED_TOKENS: readonly string[] = [
  // Direct commercial nouns
  'subscription', 'subscribe', 'subscribed', 'subscribing',
  'billing', 'billed', 'invoice',
  'payment', 'paid', 'charge', 'charged',
  'price', 'pricing', 'cost', 'fee',
  'plan', 'tier',
  'trial', 'free trial',
  'stripe',
  'purchase', 'buy', 'checkout',
  'upgrade', 'upgrading', 'downgrade',
  'renew', 'renewal',
  'cancellation', 'cancel subscription',
  'reactivate', 'reactivation',

  // Currency & cadence
  'eur', 'usd', 'ron',
  'per month', '/month', '/mo', 'monthly',
  'per seat', 'per user',

  // Review-magnet phrasing
  'restore full access', 'regain access',
  'manage subscription', 'manage plan',
  'past due', 'past_due',
];

const BANNED_REGEX = new RegExp(
  '(?:' +
    NATIVE_BANNED_TOKENS
      .map((tok) => tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .map((tok) => (/^\w/.test(tok) && /\w$/.test(tok) ? `\\b${tok}\\b` : tok))
      .join('|') +
  ')',
  'i',
);

/**
 * On native builds, returns a neutral fallback if the message contains any
 * banned commercial wording; otherwise passes the message through unchanged.
 * On web, always returns the message unchanged.
 *
 * Use this to wrap any user-visible string whose source you don't fully control:
 * - API error messages bubbled up to toasts
 * - Server-driven copy (notifications, banners)
 * - Catch-all error handlers
 *
 * Do NOT use it to launder hardcoded UI copy — fix that copy at source instead.
 *
 * @param message  The raw message that would be shown to the user.
 * @param fallback Optional override for the neutral fallback (defaults to a
 *                 generic "There's an issue. Contact support for help." pulled
 *                 from i18n if available, English fallback otherwise).
 */
export function sanitizeNativeMessage(message: string | null | undefined, fallback?: string): string {
  if (!message) return fallback ?? defaultFallback();
  if (!config.IS_NATIVE) return message;
  if (BANNED_REGEX.test(message)) return fallback ?? defaultFallback();
  return message;
}

function defaultFallback(): string {
  const k = 'limitedUsage.blockedMessage';
  const translated = i18n.t(k, { ns: 'common', defaultValue: '' });
  if (translated && translated !== k) return translated;
  return "This feature is not available on your current plan.";
}
