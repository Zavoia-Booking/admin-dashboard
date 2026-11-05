import { flushSync } from "react-dom"
import { getNativePlatform } from "../../app/config/env"

/**
 * Bottom drawers that rise and fall with the iOS soft keyboard.
 *
 * For a field inside a bottom drawer, keyboardChrome.ts switches Capacitor's
 * Keyboard plugin to `resize: none`, so the web view keeps its size and the
 * keyboard slides over it. The plugin's native resize could not be used: it
 * lands ~0.2s after the keyboard has settled, and WebKit moves bottom-anchored
 * fixed layers at that frame change before any web commit — the drawer dropped
 * when its footer hid, then snapped up late.
 *
 * Each drawer instead animates the individual `translate` property with the
 * keyboard's own curve. vaul owns `transform` (its keyframes, drag and the
 * swipe math that reads it), and `translate` composes on top without vaul
 * seeing it. Every move starts from where the drawer is on screen, so its top
 * edge stays put when the footer hides or returns, and ends with its bottom
 * edge on the keyboard. While the keyboard is up each drawer is capped to the
 * space above it, as the dvh-based caps were when the web view shrank, so a
 * scrolling body stays reachable however its content grows. WAAPI rather than
 * transitions: html.kb-animating zeroes every transition while the keyboard
 * moves, and vaul rewrites inline transitions.
 *
 * Full-screen panels (BaseSlider with followKeyboard) take part in the same
 * sessions but don't rise: they animate a bottom padding to the keyboard's
 * height on the same curve, so their own background stays under the
 * translucent keyboard and the footer rides down with it when it closes.
 */

interface KeyboardMotion {
  duration: number
  easing: string
}

// Fitted to a 60fps screen recording of the iOS 26 keyboard (within 5px over
// two samples each way), a frame shorter than measured for the bridge delay
// before the keyboard events reach JS.
export const KEYBOARD_SHOW: KeyboardMotion = { duration: 250, easing: "cubic-bezier(0.2, 0.46, 0.28, 1)" }
export const KEYBOARD_HIDE: KeyboardMotion = { duration: 215, easing: "cubic-bezier(0.26, 0.46, 0.4, 1)" }
const INSTANT: KeyboardMotion = { duration: 0, easing: "linear" }
const RETARGET_MIN_MS = 120

interface InlineStyle {
  value: string
  priority: string
}

interface FollowedDrawer {
  el: HTMLElement
  lift: Animation | null
  cap: Animation | null
  /** The drawer's own inline styles while ours replace them. */
  inlineCap: InlineStyle | null
  pin: InlineStyle | null
  skirt: InlineStyle | null
  keyboard: number
  motion: KeyboardMotion | null
  startedAt: number
}

interface Snapshot {
  /** On-screen top without our translate: layout plus vaul's own transform. */
  base: number
  /** On-screen height while capped, so a new cap continues from it. */
  cappedHeight: number | null
}

interface InsetPanel {
  el: HTMLElement
  inset: Animation | null
  /** Padding the running or finished inset heads for. */
  target: number
}

const drawers = new Set<FollowedDrawer>()
const panels = new Set<InsetPanel>()
let keyboardHeight = 0

/** Registers a bottom drawer's content element for its lifetime. No-op off iOS. */
export function followKeyboard(el: HTMLElement): () => void {
  if (getNativePlatform() !== "ios") return () => {}
  const drawer: FollowedDrawer = {
    el,
    lift: null,
    cap: null,
    inlineCap: null,
    pin: null,
    skirt: null,
    keyboard: 0,
    motion: null,
    startedAt: 0,
  }
  drawers.add(drawer)
  // Opened during a drawer keyboard session: start out resting on the keyboard.
  if (keyboardHeight > 0) place([drawer], [snapshot(drawer)], INSTANT)
  return () => {
    drawers.delete(drawer)
    stop(drawer)
  }
}

/** Registers a full-screen panel that pads itself for the keyboard. No-op off iOS. */
export function insetForKeyboard(el: HTMLElement): () => void {
  if (getNativePlatform() !== "ios") return () => {}
  const panel: InsetPanel = { el, inset: null, target: 0 }
  panels.add(panel)
  if (keyboardHeight > 0) inset(panel, INSTANT)
  return () => {
    panels.delete(panel)
    panel.inset?.cancel()
  }
}

/** Focus is inside a followed drawer or an inset panel. */
export function isFocusInFollowedDrawer() {
  const focused = document.activeElement
  if (!focused) return false
  for (const drawer of drawers) {
    if (drawer.el.contains(focused)) return true
  }
  for (const panel of panels) {
    if (panel.el.contains(focused)) return true
  }
  return false
}

/**
 * Moves every followed drawer to rest on a keyboard of `height` (0: no
 * keyboard). `change` runs in between — it hides or restores footers — and
 * each drawer keeps its on-screen top across whatever it re-lays out.
 */
export function moveFollowedDrawers(height: number, motion: KeyboardMotion, change: () => void) {
  keyboardHeight = height
  const list = Array.from(drawers).filter((drawer) => drawer.el.isConnected)
  const before = list.map(snapshot)
  flushSync(change)
  place(list, before, motion)
  panels.forEach((panel) => inset(panel, motion))
}

/** Puts every followed drawer back at rest at once (the web view resized after all). */
export function dropFollowedDrawers() {
  keyboardHeight = 0
  drawers.forEach(stop)
  panels.forEach((panel) => {
    panel.inset?.cancel()
    panel.inset = null
    panel.target = 0
  })
}

/** Animates a panel's bottom padding to the part of it the keyboard covers. */
function inset(panel: InsetPanel, motion: KeyboardMotion) {
  const { el } = panel
  if (!el.isConnected) return
  const covered =
    keyboardHeight > 0 ? Math.max(0, Math.round(el.getBoundingClientRect().bottom - (window.innerHeight - keyboardHeight))) : 0
  // Repeated keyboardWillShow with the same height: let the glide finish.
  if (panel.inset && Math.abs(covered - panel.target) < 1) return
  const from = parseFloat(getComputedStyle(el).paddingBottom) || 0
  panel.inset?.cancel()
  panel.inset = null
  panel.target = covered
  const own = parseFloat(getComputedStyle(el).paddingBottom) || 0
  const to = Math.max(own, covered)
  if (Math.abs(from - to) < 1 && to === own) return
  const animation = el.animate([{ paddingBottom: `${from}px` }, { paddingBottom: `${to}px` }], {
    duration: motion.duration,
    easing: motion.easing,
    fill: "forwards",
  })
  panel.inset = animation
  if (covered === 0) {
    animation.finished.then(
      () => {
        if (panel.inset !== animation) return
        animation.cancel()
        panel.inset = null
      },
      () => {},
    )
  }
}

function snapshot(drawer: FollowedDrawer): Snapshot {
  const capped = drawer.cap !== null || drawer.inlineCap !== null
  return { base: baseTop(drawer.el), cappedHeight: capped ? drawer.el.offsetHeight : null }
}

function place(list: FollowedDrawer[], before: Snapshot[], motion: KeyboardMotion) {
  const viewport = window.innerHeight
  const minTop = topLimit()
  list.forEach((drawer, index) => {
    if (!drawer.el.isConnected) return
    try {
      move(drawer, before[index], viewport, minTop, motion)
    } catch {
      // A drawer that can't be measured or animated is left at rest rather
      // than stopping the others.
      stop(drawer)
    }
  })
}

function move(drawer: FollowedDrawer, before: Snapshot, viewport: number, minTop: number, motion: KeyboardMotion) {
  const { el } = drawer
  // Repeated keyboardWillShow with the same height (moving between fields, or
  // iOS's second event once the keyboard is at full height): let the glide finish.
  if (
    motion === KEYBOARD_SHOW &&
    drawer.motion === KEYBOARD_SHOW &&
    drawer.keyboard === keyboardHeight &&
    Math.abs(baseTop(el) - before.base) < 1
  ) {
    return
  }

  uncap(drawer)
  unpin(drawer)
  const height = el.offsetHeight
  const bottom = el.offsetTop + height
  const target = keyboardHeight > 0 ? Math.min(0, viewport - keyboardHeight - bottom) : 0
  const timing = timingFor(drawer, motion)
  let rest = target
  let deferredCap: number | null = null
  let capShrinks = false
  if (keyboardHeight > 0) {
    addSkirt(drawer)
    // The space between minTop and the keyboard, unless the drawer's own
    // max-height already keeps it within that.
    const space = Math.max(0, Math.round(bottom + target - minTop))
    const ownMax = parseFloat(getComputedStyle(el).maxHeight)
    if (!(ownMax <= space)) {
      // Animate from the height on screen; a drawer that fits gets a static
      // cap that only bounds later growth.
      const capFrom = before.cappedHeight ?? (height > space ? height : space)
      if (cap(drawer, capFrom, space, timing)) {
        capShrinks = Math.min(capFrom, space) < height
      } else if (space >= height) {
        setInlineCap(drawer, space)
      } else {
        // An `!important` max-height (the website builder's section sheet)
        // outranks animations, and capping it inline now would cut the drawer
        // short in one step. Glide its top to minTop instead and cap it behind
        // the keyboard once the lift ends.
        rest = Math.min(0, target + height - space)
        deferredCap = space
      }
    }
  }

  // Continue from the drawer's current on-screen position, inverting only the
  // layout change from `change` and the caps.
  const from = before.base + currentTranslate(el) - baseTop(el)
  drawer.lift?.cancel()
  drawer.lift = null
  drawer.keyboard = keyboardHeight
  drawer.motion = motion
  drawer.startedAt = performance.now()
  if (Math.abs(from) < 1 && Math.abs(rest) < 1) {
    if (keyboardHeight === 0) stop(drawer)
    return
  }

  // A shrinking cap runs on the main thread; adding the lift instead of
  // replacing keeps it off the compositor so both share one clock and the top
  // edge glides rather than overshooting.
  const lift = el.animate([{ translate: `0 ${from}px` }, { translate: `0 ${rest}px` }], {
    ...timing,
    fill: "forwards",
    composite: capShrinks ? "add" : "replace",
  })
  drawer.lift = lift
  lift.finished.then(
    () => {
      if (drawer.lift !== lift) return
      if (target === 0) {
        stop(drawer)
        return
      }
      if (deferredCap !== null) setInlineCap(drawer, deferredCap)
      pin(drawer, -target)
    },
    () => {},
  )
}

/**
 * Lets a finished lift rest in layout instead of on the compositor: WebKit
 * places the caret and selection handles from layout, so a field left under a
 * translate keeps showing its caret where it was before the lift. Same task,
 * same position on screen.
 */
function pin(drawer: FollowedDrawer, offset: number) {
  const { el } = drawer
  const margin = parseFloat(getComputedStyle(el).marginBottom) || 0
  drawer.pin = saveInline(el, "margin-bottom")
  el.style.setProperty("margin-bottom", `${margin + offset}px`, "important")
  drawer.lift?.cancel()
  drawer.lift = null
}

function unpin(drawer: FollowedDrawer) {
  restoreInline(drawer.el, "margin-bottom", drawer.pin)
  drawer.pin = null
}

/** Animates a max-height cap; false when an `!important` max-height overrides it. */
function cap(drawer: FollowedDrawer, from: number, to: number, timing: KeyframeAnimationOptions) {
  const { el } = drawer
  const animation = el.animate([{ maxHeight: `${from}px` }, { maxHeight: `${to}px` }], { ...timing, fill: "forwards" })
  // Check the end state, then rewind.
  animation.currentTime = Number(timing.duration) || 0
  const takes = Math.abs(parseFloat(getComputedStyle(el).maxHeight) - to) < 1
  animation.currentTime = 0
  if (takes) drawer.cap = animation
  else animation.cancel()
  return takes
}

/** An inline `!important` cap, which outranks an `!important` stylesheet max-height. */
function setInlineCap(drawer: FollowedDrawer, value: number) {
  const { el } = drawer
  drawer.inlineCap ??= saveInline(el, "max-height")
  el.style.setProperty("max-height", `${value}px`, "important")
}

function uncap(drawer: FollowedDrawer) {
  drawer.cap?.cancel()
  drawer.cap = null
  restoreInline(drawer.el, "max-height", drawer.inlineCap)
  drawer.inlineCap = null
}

/**
 * vaul paints the strip under a lifted drawer with its ::after skirt, which a
 * drawer that clips its overflow clips too; the dim overlay would then show
 * through the translucent keyboard and its rounded corners. A box-shadow is not
 * clipped by the box's own overflow: this one starts below the rounded top
 * corners and reaches past the keyboard.
 */
function addSkirt(drawer: FollowedDrawer) {
  const { el } = drawer
  if (drawer.skirt) restoreInline(el, "box-shadow", drawer.skirt)
  const style = getComputedStyle(el)
  if (style.overflowX === "visible" && style.overflowY === "visible") {
    drawer.skirt = null
    return
  }
  const spread = Math.ceil(keyboardHeight / 2)
  const skirt = `0 ${spread + 24}px 0 ${spread}px ${style.backgroundColor}`
  const own = style.boxShadow
  drawer.skirt = saveInline(el, "box-shadow")
  el.style.setProperty("box-shadow", own && own !== "none" ? `${skirt}, ${own}` : skirt)
}

function stop(drawer: FollowedDrawer) {
  drawer.lift?.cancel()
  drawer.lift = null
  uncap(drawer)
  unpin(drawer)
  restoreInline(drawer.el, "box-shadow", drawer.skirt)
  drawer.skirt = null
  drawer.keyboard = 0
  drawer.motion = null
}

function saveInline(el: HTMLElement, property: string): InlineStyle {
  return { value: el.style.getPropertyValue(property), priority: el.style.getPropertyPriority(property) }
}

function restoreInline(el: HTMLElement, property: string, saved: InlineStyle | null) {
  if (!saved) return
  if (saved.value) el.style.setProperty(property, saved.value, saved.priority)
  else el.style.removeProperty(property)
}

function timingFor(drawer: FollowedDrawer, motion: KeyboardMotion): KeyframeAnimationOptions {
  let duration = motion.duration
  // Retargeting mid-glide (keyboard height changed): finish with the keyboard
  // instead of replaying the whole curve.
  if (motion === KEYBOARD_SHOW && drawer.motion === KEYBOARD_SHOW) {
    const elapsed = performance.now() - drawer.startedAt
    if (elapsed < duration) duration = Math.max(RETARGET_MIN_MS, duration - elapsed)
  }
  // A closing drawer must be back at rest before vaul's exit animation ends:
  // the exit only travels the drawer's own height, so a leftover lift would
  // leave it short of off-screen.
  if (drawer.el.getAttribute("data-state") === "closed") duration = Math.min(duration, exitTimeLeft(drawer.el))
  return { duration, easing: motion.easing }
}

function exitTimeLeft(el: HTMLElement) {
  for (const animation of el.getAnimations()) {
    if (!(animation instanceof CSSAnimation)) continue
    const timing = animation.effect?.getComputedTiming()
    const left = Number(timing?.endTime) - Number(timing?.localTime) - 16
    return Number.isFinite(left) ? Math.max(0, left) : 0
  }
  return 0
}

// Same top limit as drawer.tsx's bottom-drawer max-height: the status bar plus 1.5rem.
function topLimit() {
  const root = getComputedStyle(document.documentElement)
  const safeTop = parseFloat(root.getPropertyValue("--safe-area-top-stable")) || 0
  return safeTop + 1.5 * (parseFloat(root.fontSize) || 16)
}

function baseTop(el: HTMLElement) {
  return el.getBoundingClientRect().top - currentTranslate(el)
}

// Vertical part of the computed `translate` ("none", "0px", "0px -120px").
function currentTranslate(el: HTMLElement) {
  const [, y] = getComputedStyle(el).translate.split(" ")
  return parseFloat(y) || 0
}
