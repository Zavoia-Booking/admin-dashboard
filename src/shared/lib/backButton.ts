import { App } from "@capacitor/app"
import { isNativeApp } from "../../app/config/env"

/**
 * Android back gesture/button — the platform's primary close affordance for
 * full-screen surfaces (Material: full-screen dialogs dismiss via X *and*
 * system back). Priority order:
 * 1. an open overlay (slider, drawer, sheet, dialog, menu — all Radix layers)
 *    closes top-most first, via the same Escape path Radix already handles;
 * 2. otherwise navigate history back;
 * 3. at the history root, minimize the app (never exit).
 * Overlays that deliberately block Escape (guarded confirm flows) block the
 * back gesture the same way, which is the intended behavior.
 */
export function wireAndroidBackButton() {
  if (!isNativeApp()) return
  void App.addListener("backButton", ({ canGoBack }) => {
    const overlayOpen = document.querySelector(
      [
        '[role="dialog"][data-state="open"]',
        '[role="alertdialog"][data-state="open"]',
        '[role="menu"][data-state="open"]',
        "[data-radix-popper-content-wrapper]",
      ].join(", "),
    )
    if (overlayOpen) {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }),
      )
      return
    }
    if (canGoBack) {
      window.history.back()
      return
    }
    void App.minimizeApp()
  })
}
