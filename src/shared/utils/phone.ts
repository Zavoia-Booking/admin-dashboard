/**
 * Formats a phone number into spaced groups for readability.
 *
 * Romanian mobile (10 digits starting with `0`) is grouped 4-3-3:
 *   "0748769719" → "0748 769 719"
 *
 * Numbers that already contain spaces, dashes, parens, or a leading `+`
 * are returned untouched — the input is treated as user-formatted.
 *
 * @example
 * formatPhone("0748769719")        // "0748 769 719"
 * formatPhone("+40 748 769 719")  // "+40 748 769 719"
 * formatPhone("")                  // ""
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (/[\s+()\-]/.test(trimmed)) return trimmed;
  if (/^0\d{9}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)} ${trimmed.slice(4, 7)} ${trimmed.slice(7)}`;
  }
  return trimmed;
}
