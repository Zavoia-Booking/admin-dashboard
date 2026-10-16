import { registerPlugin } from "@capacitor/core"
import { getNativePlatform } from "../../app/config/env"

interface WindowBackgroundPlugin {
  setColor(options: { color: string }): Promise<void>
}

/** App-local iOS plugin (ios/App/App/WindowBackgroundPlugin.swift). */
const WindowBackground = registerPlugin<WindowBackgroundPlugin>("WindowBackground")

// Same surfaces the index.html boot script paints on <html>/<body>.
const LIGHT_SURFACE = "#FFFFFF"
const DARK_SURFACE = "#1A1A18"

/**
 * Recolor the native window behind the web view to match the app theme.
 * iOS only: the window shows through the keyboard's rounded corners while
 * the web view is resized for the keyboard. No-op elsewhere.
 */
export function syncNativeWindowBackground(dark: boolean) {
  if (getNativePlatform() !== "ios") return
  void WindowBackground.setColor({ color: dark ? DARK_SURFACE : LIGHT_SURFACE }).catch(() => {})
}
