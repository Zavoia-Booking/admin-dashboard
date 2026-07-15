/**
 * Cross-component channel for "this location needs photos" moments: a blocked
 * publish or visibility toggle requests attention on a location's upload card,
 * and the mounted MarketplaceImagesSection scrolls to it and pulses.
 *
 * Two delivery paths because the gallery may or may not exist yet when the
 * request fires (tab switch / master-list drill-in mounts it a beat later):
 * - a window event, delayed enough for tab/panel switches to settle, and
 * - a pending flag the gallery consumes on mount.
 */
const PORTFOLIO_ATTENTION_EVENT = "zavoia:portfolio-attention";

let pendingLocationId: number | null = null;

export function requestPortfolioAttention(locationId: number): void {
  pendingLocationId = locationId;
  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent<number>(PORTFOLIO_ATTENTION_EVENT, { detail: locationId }),
    );
  }, 350);
}

/** Returns true (once) if attention was requested for this location. */
export function consumePortfolioAttention(locationId: number): boolean {
  if (pendingLocationId === locationId) {
    pendingLocationId = null;
    return true;
  }
  return false;
}

export { PORTFOLIO_ATTENTION_EVENT };
