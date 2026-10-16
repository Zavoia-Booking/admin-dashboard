import { SystemBars, SystemBarsStyle } from "@capacitor/core"
import { Keyboard, KeyboardStyle } from "@capacitor/keyboard"
import { isNativeApp } from "../../app/config/env"
import { syncNativeWindowBackground } from "./nativeWindowBackground"

/**
 * Single write-path for the theme: DOM class, persistence, and native
 * system-bar icon style. index.html's boot script applies the persisted
 * class before React mounts; every runtime toggle should go through here.
 */
export function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark)
  localStorage.setItem("theme", dark ? "dark" : "light")
  syncSystemBarsWithTheme(dark)
}

/**
 * Match Android/iOS status- and navigation-bar icon color to the app theme.
 * SystemBarsStyle.Dark = light icons on dark background (app dark mode).
 * Goes through Capacitor core's SystemBars (not the community SafeArea
 * plugin) because core re-applies its remembered style on configuration
 * changes — it must be the single writer or it clobbers other writers.
 * The static capacitor.config SystemBars style only covers the light default.
 */
export function syncSystemBarsWithTheme(
  dark: boolean = document.documentElement.classList.contains("dark"),
) {
  if (!isNativeApp()) return
  void SystemBars.setStyle({
    style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
  }).catch(() => {})
  // iOS keyboard appearance otherwise follows the *device* dark mode, so a
  // light-themed app on a dark-mode phone gets a dark keyboard that visibly
  // re-styles itself after opening. iOS-only; rejects on Android, ignored.
  void Keyboard.setStyle({
    style: dark ? KeyboardStyle.Dark : KeyboardStyle.Light,
  }).catch(() => {})
  syncNativeWindowBackground(dark)
}

/** Force light system-bar icons over a full-screen dark surface (e.g. the preview dialog); `false` re-syncs to the theme. */
export function setSystemBarsDarkSurface(active: boolean) {
  if (!isNativeApp()) return
  if (!active) { syncSystemBarsWithTheme(); return }
  void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {})
}
