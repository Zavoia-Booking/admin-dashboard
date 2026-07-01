// Public surface of the microsite renderer. The implementation lives in ./preview (orchestrator in
// Microsite.tsx, sections under preview/sections, shared foundation under preview/shared). This barrel
// keeps every existing import path (`./LivePreview`) stable for the editor-side consumers, re-exporting
// each symbol straight from its canonical home (so there's a single source per export, no drift).
export { LivePreview, default } from "./preview/Microsite";
export { UNNUMBERED } from "./preview/shared/constants";
export { marqueeItems, MARQUEE_MIN_ITEMS } from "./preview/sections/marquee/Marquee";
export type { PreviewData, PreviewReview, RatingBars } from "./preview/shared/types";
