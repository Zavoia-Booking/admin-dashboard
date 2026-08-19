/**
 * crypto.randomUUID is secure-context-only — undefined when the app runs over
 * plain-HTTP (e.g. native live reload from a LAN IP). Fall back to a timestamp
 * + random suffix; callers use these as local client-side keys only.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
