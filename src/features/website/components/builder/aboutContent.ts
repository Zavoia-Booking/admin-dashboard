/**
 * The About section is stored as a single string ("aboutContent") but authored as two parts: a bold
 * headline (the serif lede) and the body story, separated by the first blank line. These helpers are the
 * single source of truth for that contract — shared by the editor (two fields), the preview renderer, and
 * the section readiness check, so they can never disagree on where the split falls.
 */

/** Split losslessly into { title, body } on the first blank line — consuming only same-line whitespace
 *  between the two newlines so a body that itself starts with a break survives a join → split round-trip.
 *  No blank line ⇒ the whole string is the headline. */
export function splitAboutContent(s: string): { title: string; body: string } {
  const m = /\n[^\S\n]*\n/.exec(s);
  if (!m) return { title: s, body: "" };
  return { title: s.slice(0, m.index), body: s.slice(m.index + m[0].length) };
}

/** Re-join the two parts into the stored string. A blank line is the contract the renderer splits on;
 *  with no body we store just the headline (no dangling separator). */
export function joinAboutContent(title: string, body: string): string {
  return body ? `${title}\n\n${body}` : title;
}

/** The headline alone (first paragraph), trimmed — used for the section-list summary. */
export function aboutHeadline(s: string): string {
  return splitAboutContent(s).title.trim();
}
