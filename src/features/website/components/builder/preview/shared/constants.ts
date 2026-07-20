import type { CSSProperties } from "react";

// Shared display / mono text styles (resolve the per-personality faces set on the root).
export const DISPLAY: CSSProperties = {
  fontFamily: "var(--mc-display)",
  fontWeight: "var(--mc-display-weight)" as CSSProperties["fontWeight"],
  letterSpacing: "var(--mc-display-tracking)",
};
export const MONO: CSSProperties = { fontFamily: "var(--mc-mono)" };

/** Section types that don't get a numbered "0N —" kicker (full-bleed hero/announcement + decorative bands). */
export const UNNUMBERED = new Set<string>(["hero", "announcement", "marquee", "nav", "footer"]);
