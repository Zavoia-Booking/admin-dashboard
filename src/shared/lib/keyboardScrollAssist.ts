import { Keyboard } from "@capacitor/keyboard"
import { isNativeApp } from "../../app/config/env"

/**
 * Keeps the focused field visible after the native keyboard opens.
 *
 * With Capacitor's iOS default (`resize: native`) the whole web view shrinks
 * to the space above the keyboard *after* the field was focused. WebKit only
 * auto-reveals a focused element for the document scroller, and this app
 * scrolls inside overflow containers (the AppLayout pane, drawers, dialogs),
 * so a field in the lower half of the screen ends up under the keyboard until
 * the user scrolls by hand. On keyboardDidShow, scroll whichever field has
 * focus into the middle of its scroll container. No-op on web.
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
    // Next frame: let the web view finish applying its new height first.
    requestAnimationFrame(() => {
      if (document.activeElement !== el) return
      el.scrollIntoView({ block: "center", behavior: "smooth" })
    })
  }).catch(() => {})
}
