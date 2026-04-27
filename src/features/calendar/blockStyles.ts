/**
 * Shared diagonal-stripe pattern for calendar blocks. Two opacities of the
 * same warm beige `rgb(156,148,134)` (= `#9C9486`), 6 px bands alternating,
 * at 45 deg. Copied from the Claude Design reference; used across mobile
 * list, mobile grid, and desktop grid/week block cards so the visual
 * language stays identical across platforms.
 */

/** Grid variant — slightly stronger alpha so the pattern registers on the
 *  smaller card surfaces inside the timed-grid views. */
export const BLOCK_STRIPE_GRID =
    "repeating-linear-gradient(45deg, rgba(156,148,134,0.15) 0, rgba(156,148,134,0.15) 6px, rgba(156,148,134,0.08) 6px, rgba(156,148,134,0.08) 12px)";

/** List variant — airier, for the larger list-card row. */
export const BLOCK_STRIPE_LIST =
    "repeating-linear-gradient(45deg, rgba(156,148,134,0.10) 0, rgba(156,148,134,0.10) 6px, rgba(156,148,134,0.03) 6px, rgba(156,148,134,0.03) 12px)";

/** Solid warm-beige accent — used for the left border stripe on block cards.
 *  Resolves to the brand Stone token so the stripe follows brand. The
 *  rgba diagonal patterns above remain hand-tuned at slightly lighter values. */
export const BLOCK_STRIPE_ACCENT = "var(--brand-stone)";
