import type { NavVariantProps } from "./types";
import { Default } from "./variants/Default";

/** Nav frost over the hero: scroll distance to full blur. LivePreview drives the frost `progress` off this
 *  (kept on the section's public surface — the orchestrator imports it). */
export const FROST_DIST = 240;

// Brand lockup · section links · CTA — the page's chrome header. Single layout; the orchestrator dispatches
// to the one variant (parity with the section scaffold — a future nav skin adds a file under variants/).
export function Nav(props: NavVariantProps) {
  return <Default {...props} />;
}
