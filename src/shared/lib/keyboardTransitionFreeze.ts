import { Keyboard } from "@capacitor/keyboard"
import { isNativeApp } from "../../app/config/env"

/**
 * Suspends CSS transitions while the native keyboard animates.
 *
 * On iOS (Capacitor `resize: native`) the whole web view shrinks and grows
 * with the keyboard over ~250ms, re-laying out the page on every frame.
 * Elements sized against the viewport (bottom drawers, sliders, dialogs)
 * then animate their own transitions against that moving target, which
 * reads as flicker and drawers "changing height". While the keyboard is in
 * motion the <html> element carries `kb-animating`, and globals.css zeroes
 * transition durations under it, so everything snaps to the final size once.
 * A timeout clears the flag in case a did-show/did-hide event never arrives.
 * No-op on web.
 */
const FLAG = "kb-animating"
const SAFETY_MS = 800

export function wireKeyboardTransitionFreeze() {
  if (!isNativeApp()) return

  let safety: number | null = null
  const root = document.documentElement

  const start = () => {
    root.classList.add(FLAG)
    if (safety !== null) window.clearTimeout(safety)
    safety = window.setTimeout(stop, SAFETY_MS)
  }
  const stop = () => {
    if (safety !== null) {
      window.clearTimeout(safety)
      safety = null
    }
    root.classList.remove(FLAG)
  }

  void Keyboard.addListener("keyboardWillShow", start).catch(() => {})
  void Keyboard.addListener("keyboardDidShow", stop).catch(() => {})
  void Keyboard.addListener("keyboardWillHide", start).catch(() => {})
  void Keyboard.addListener("keyboardDidHide", stop).catch(() => {})
}
