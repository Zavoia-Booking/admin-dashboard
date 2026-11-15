import { registerPlugin } from "@capacitor/core"
import { getNativePlatform } from "../../app/config/env"

interface WindowBackgroundPlugin {
  setColor(options: { color: string }): Promise<void>
}

/**
 * App-local native plugin: ios/App/App/WindowBackgroundPlugin.swift and
 * android/app/src/main/java/com/bookaroo/admin/WindowBackgroundPlugin.java.
 */
const WindowBackground = registerPlugin<WindowBackgroundPlugin>("WindowBackground")

// Same surfaces the index.html boot script paints on <html>/<body>.
const LIGHT_SURFACE = "#FFFFFF"
const DARK_SURFACE = "#1A1A18"

/**
 * Recolor the native window behind the web view to match the app theme.
 * iOS: the window shows through the keyboard's rounded corners while the web
 * view is resized for the keyboard. Android: the window fills the status- and
 * navigation-bar strips when the web view is inset from them. No-op on web.
 */
export function syncNativeWindowBackground(dark: boolean) {
  const platform = getNativePlatform()
  if (platform !== "ios" && platform !== "android") return
  void WindowBackground.setColor({ color: dark ? DARK_SURFACE : LIGHT_SURFACE }).catch(() => {})
}
