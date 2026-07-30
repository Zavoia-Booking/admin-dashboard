/**
 * The dashboard scrolls AppLayout's <main> pane, not the window, so `window.scrollTo`
 * is a no-op on most pages. This attribute marks that pane so anything can find it.
 */
export const APP_SCROLL_CONTAINER_ATTR = "data-app-scroll-container";

/**
 * Jump the content pane back to the top.
 *
 * Views that swap in place under the same AppLayout (marketplace's marketing view →
 * listing configuration, for example) keep <main> mounted, so the reader's scroll
 * offset carries over into content it no longer matches — on mobile that drops you
 * into the middle of the new view.
 */
export function scrollAppContentToTop(behavior: ScrollBehavior = "auto") {
  const container = document.querySelector<HTMLElement>(
    `[${APP_SCROLL_CONTAINER_ATTR}]`,
  );

  if (container) {
    container.scrollTo({ top: 0, behavior });
    return;
  }

  window.scrollTo({ top: 0, behavior });
}

interface ScrollToElementOptions {
  /** "center" mirrors scrollIntoView's block:"center"; "start" parks it at the top edge. */
  block?: "center" | "start";
  /** Extra px of breathing room above the element — clears sticky headers when block is "start". */
  offset?: number;
  behavior?: ScrollBehavior;
}

/**
 * Bring an element into view by scrolling the content pane to a computed offset.
 *
 * Deliberately not `scrollIntoView`: that walks up the tree and scrolls *every* scrollable
 * ancestor, and which one it decides to move — including `overflow:hidden` boxes, which
 * still count as scroll containers — varies between engines. Chrome on the desktop and the
 * Android/iOS webviews Capacitor ships do not always agree, and when it picks a clipped
 * inner box the page visibly does nothing. Targeting the one pane that actually scrolls
 * removes the ambiguity.
 */
export function scrollAppContentToElement(
  element: HTMLElement,
  { block = "center", offset = 0, behavior = "smooth" }: ScrollToElementOptions = {},
) {
  const container = document.querySelector<HTMLElement>(
    `[${APP_SCROLL_CONTAINER_ATTR}]`,
  );

  if (!container) {
    element.scrollIntoView({ behavior, block });
    return;
  }

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  // Element's distance from the top of the container's scrollable content.
  const elementTop = elementRect.top - containerRect.top + container.scrollTop;
  const target =
    block === "center"
      ? elementTop - Math.max(0, container.clientHeight - elementRect.height) / 2
      : elementTop - offset;

  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
  container.scrollTo({
    top: Math.min(maxTop, Math.max(0, target)),
    behavior,
  });
}
