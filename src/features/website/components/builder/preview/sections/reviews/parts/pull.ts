/** A short display-serif headline pulled from a review's opening clause (capped to a few words), so the
 *  stacked deck card can lead with a pull-quote without inventing any copy. Mirrors the source `mcPull`. */
export function pullQuote(text: string): string {
  const trimmed = (text || "").trim();
  const clause = trimmed.split(/[—–.,!?;:“”"]/)[0].trim();
  const base = clause.split(/\s+/).length >= 3 ? clause : trimmed;
  return base.split(/\s+/).slice(0, 7).join(" ").replace(/[\s,–—-]+$/, "");
}
