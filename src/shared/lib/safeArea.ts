import { isNativeApp } from "../../app/config/env"

/**
 * Pins the status-bar inset into a stable CSS variable,
 * `--safe-area-top-stable`, for native builds.
 *
 * env(safe-area-inset-top) transiently collapses to 0 while the Android
 * keyboard is open (WebView inset recalculation bugs — crbug 461332423,
 * 457682720), which zeroes any padding/scrim driven directly by env() and
 * lets content collide with the status bar mid-typing. A hidden probe
 * element measures env() and copies it into the variable; zero readings are
 * ignored so the keyboard glitch can't clear it, while genuine changes
 * (rotation, late inset delivery on boot) are picked up by ResizeObserver.
 *
 * Consumers use `var(--safe-area-top-stable, env(safe-area-inset-top))` —
 * on web the variable is never set and the env() fallback (0) applies.
 */
export function pinStableSafeAreaTop() {
  if (!isNativeApp()) return

  const probe = document.createElement("div")
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-top);visibility:hidden;pointer-events:none"
  probe.setAttribute("aria-hidden", "true")
  document.documentElement.appendChild(probe)

  const apply = () => {
    const height = probe.getBoundingClientRect().height
    if (height > 0) {
      document.documentElement.style.setProperty("--safe-area-top-stable", `${height}px`)
    }
  }

  apply()
  new ResizeObserver(apply).observe(probe)
}
