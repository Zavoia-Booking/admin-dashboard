/**
 * Business-page vanity-slug helper (frontend).
 *
 * Mirrors the backend `slugifyBusinessName` (admin-api `src/utils/slug.ts`) so the editable default we
 * pre-fill matches what the backend would generate. The backend remains the authority for the final
 * persisted value + uniqueness; this only produces a starting suggestion. Returns '' when nothing
 * usable remains (empty, symbol-only, or < 3 chars), so the field stays empty and the backend falls
 * back to its own default on publish.
 */

// Romanian letters incl. the Windows cedilla variants ş/ţ (U+015F/U+0163) — mapped explicitly before
// the NFD strip so output is deterministic regardless of the runtime's Unicode data.
const ROMANIAN_MAP: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ț: "t", ş: "s", ţ: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ț: "t", Ş: "s", Ţ: "t",
};
const ROMANIAN_RE = new RegExp(`[${Object.keys(ROMANIAN_MAP).join("")}]`, "g");

export function slugify(name?: string | null): string {
  if (!name || !name.trim()) return "";

  let slug = name
    .replace(ROMANIAN_RE, (ch) => ROMANIAN_MAP[ch])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > 100) slug = slug.slice(0, 100).replace(/-+$/g, "");

  return slug.length >= 3 ? slug : "";
}
