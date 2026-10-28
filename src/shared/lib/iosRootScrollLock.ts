import { Keyboard } from "@capacitor/keyboard"
import { getNativePlatform } from "../../app/config/env"

/**
 * Pins the iOS web view's root scroll at 0 while a fixed-height app shell is
 * mounted.
 *
 * The Keyboard plugin (`resize: native`) shrinks the web view only after the
 * keyboard animation ends (+0.2s). Until then WebKit sees the focused field
 * covered by the keyboard and scrolls the whole web view up to reveal it; the
 * resize then lands on top of that offset, so the page jumps up and stays
 * shifted — worst inside drawers, which are pinned to the viewport.
 *
 * AppLayout pages never scroll the document (content scrolls in an inner
 * container), so the plugin's `setScroll({ isDisabled: true })`, which forces
 * the root content offset back to zero, is safe there. Pages outside it
 * (auth, invitations, …) still scroll the document, so this is scoped to
 * AppLayout and refcounted across overlapping mounts. No-op off iOS.
 */
let holds = 0

export function holdIosRootScrollLock(): () => void {
  if (getNativePlatform() !== "ios") return () => {}
  holds += 1
  if (holds === 1) {
    window.scrollTo(0, 0)
    void Keyboard.setScroll({ isDisabled: true }).catch(() => {})
  }
  return () => {
    holds = Math.max(0, holds - 1)
    if (holds === 0) void Keyboard.setScroll({ isDisabled: false }).catch(() => {})
  }
}
