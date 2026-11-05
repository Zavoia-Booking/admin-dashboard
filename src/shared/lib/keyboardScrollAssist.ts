import { Keyboard } from "@capacitor/keyboard"
import { isNativeApp } from "../../app/config/env"
import { isKeyboardShrinkPending } from "./keyboardChrome"

/**
 * Keeps the focused field visible after the native keyboard opens.
 *
 * With Capacitor's iOS default (`resize: native`) the whole web view shrinks
 * to the space above the keyboard *after* the field was focused. WebKit only
 * auto-reveals a focused element for the document scroller, and this app
 * scrolls inside overflow containers (the AppLayout pane, drawers, dialogs),
 * so a field in the lower half of the screen ends up under the keyboard until
 * the user scrolls by hand. Once the keyboard is up, scroll whichever field
 * has focus into the middle of its scroll container. No-op on web.
 *
 * Deliberately not `scrollIntoView`: when the field's own scroller can't move
 * any further, it pushes the remainder into the root, which the iOS scroll
 * lock (iosRootScrollLock.ts) never brings back in sync, leaving a whole
 * slider shifted up with a blank band under it.
 */
export function wireKeyboardScrollAssist() {
  if (!isNativeApp()) return

  void Keyboard.addListener("keyboardDidShow", () => {
    const el = document.activeElement
    if (!(el instanceof HTMLElement)) return
    const editable =
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      el.isContentEditable
    if (!editable) return
    if (!isKeyboardShrinkPending()) {
      reveal(el)
      return
    }
    // iOS shrinks the web view ~0.2s after keyboardDidShow: center the field
    // in the shrunk layout, not the full-height one.
    const onShrink = () => {
      window.clearTimeout(fallback)
      window.removeEventListener("resize", onShrink)
      reveal(el)
    }
    const fallback = window.setTimeout(onShrink, 500)
    window.addEventListener("resize", onShrink)
  }).catch(() => {})
}

function reveal(el: HTMLElement, frames = 0) {
  requestAnimationFrame(() => {
    if (document.activeElement !== el) return
    const { scrollers, panel } = ancestorsOf(el)
    // A fixed panel is laid out against the shrunk web view a moment after
    // the 'resize' event; the scroll range inside it is stale until then.
    if (panel && panel.getBoundingClientRect().bottom > window.innerHeight + 1 && frames < 20) {
      reveal(el, frames + 1)
      return
    }
    const scroller = scrollers.find((s) => s.scrollHeight > s.clientHeight + 1)
    if (!scroller) return
    const field = el.getBoundingClientRect()
    const top = scroller.getBoundingClientRect().top + scroller.clientTop
    const target = scroller.scrollTop + field.top - top - Math.max(0, scroller.clientHeight - field.height) / 2
    scroller.scrollTo({ top: Math.max(0, target), behavior: "smooth" })
  })
}

/**
 * Ancestors that scroll on their own (overflow auto/scroll), nearest first,
 * and the nearest position:fixed one (a drawer or slider panel).
 */
function ancestorsOf(el: HTMLElement) {
  const scrollers: HTMLElement[] = []
  let panel: HTMLElement | null = null
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY, position } = getComputedStyle(node)
    if (overflowY === "auto" || overflowY === "scroll") scrollers.push(node)
    if (!panel && position === "fixed") panel = node
  }
  return { scrollers, panel }
}
