import { getNativePlatform } from "../../app/config/env"

/**
 * Stops iOS from zooming the page when an input with font-size < 16px gets
 * focus (WebKit auto-zooms those, and the page stays zoomed after blur,
 * breaking fixed layouts). Many inputs here are intentionally 12–14px,
 * including the website studio's CSS-styled fields, so instead of resizing
 * each one we add `maximum-scale=1` to the viewport on iOS only.
 *
 * Safari on iOS still allows pinch-zoom with this set; only the focus zoom is
 * suppressed. Android never auto-zooms on focus but would honour the limit
 * for pinch-zoom, so it is left untouched.
 */
export function preventIosInputZoom() {
  const isIos =
    getNativePlatform() === "ios" ||
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  if (!isIos) return

  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (!meta || /maximum-scale/.test(meta.content)) return
  meta.content = `${meta.content}, maximum-scale=1`
}
