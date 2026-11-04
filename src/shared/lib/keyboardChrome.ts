import { Keyboard, KeyboardResize, type KeyboardInfo } from "@capacitor/keyboard"
import { getNativePlatform } from "../../app/config/env"
import {
  KEYBOARD_HIDE,
  KEYBOARD_SHOW,
  dropFollowedDrawers,
  isFocusInFollowedDrawer,
  moveFollowedDrawers,
} from "./keyboardDrawerFollow"

/**
 * iOS soft-keyboard state behind useKeyboardVisible: when bottom chrome (tab
 * bar, drawer and slider footers) hides for the keyboard, when it comes back,
 * and whether the keyboard may resize the web view at all.
 *
 * Capacitor's `resize: native` shrinks the web view only ~0.2s after the
 * keyboard has settled and grows it back 0.01s after keyboardWillHide. So:
 * - A field inside a bottom drawer: the plugin is switched to `resize: none`
 *   (on focus, and again from keyboardWillShow — both long before its deferred
 *   resize reads the mode) and the drawers follow the keyboard themselves
 *   (keyboardDrawerFollow.ts). Nothing native moves, so chrome returns right at
 *   keyboardWillHide and the drawers glide down with their footers back. The
 *   switch never happens over a shrunk web view: the plugin's restore would
 *   then be a no-op and leave it short.
 * - Anything else keeps the native resize, and footers still wait for
 *   keyboardDidHide. Only the tab bar returns early: from the 'resize' event of
 *   the update that grows the web view back, which already carries the
 *   full-height layout, so it can't paint at the keyboard's top edge (why it
 *   used to wait for keyboardDidHide) yet is back while the keyboard retracts.
 * Footers inside a drawer that is still sliding out always wait for
 * keyboardDidHide, so they don't reappear mid-close. Android and the web keep
 * the event-based hook in useKeyboardVisible.ts.
 */

let chromeHidden = false
let navHidden = false
// Bumped on every keyboardWillShow. A consumer that mounts while the keyboard
// is up stays visible until the next one, as each instance did before this
// state was shared.
let showSeq = 1
const listeners = new Set<() => void>()

let keyboardUp = false
let hiding = false
let drawerSession = false
let resizeMode = KeyboardResize.Native
let restingHeight = 0

export function subscribeKeyboardChrome(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

export const getKeyboardShowSeq = () => showSeq
export const getKeyboardChromeSnapshot = () => (chromeHidden ? showSeq : 0)
export const getKeyboardNavSnapshot = () => (navHidden ? showSeq : 0)

export function wireKeyboardChrome() {
  if (getNativePlatform() !== "ios") return

  // The plugin keeps its mode across a reload of the page (web content process
  // restart), which may have happened mid drawer session.
  void Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {})
  restingHeight = window.innerHeight
  void Keyboard.addListener("keyboardWillShow", onWillShow).catch(() => {})
  void Keyboard.addListener("keyboardWillHide", onWillHide).catch(() => {})
  void Keyboard.addListener("keyboardDidHide", onDidHide).catch(() => {})
  document.addEventListener("focusin", onFocusIn, true)
  window.addEventListener("resize", onResize)
}

function onFocusIn(event: FocusEvent) {
  if ((keyboardUp && !hiding) || !isFullHeight()) return
  const target = event.target
  const editable =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  if (editable && isFocusInFollowedDrawer()) setResizeMode(KeyboardResize.None)
}

function onWillShow({ keyboardHeight }: KeyboardInfo) {
  if (!keyboardUp || hiding) {
    drawerSession = isFullHeight() && isFocusInFollowedDrawer()
    setResizeMode(drawerSession ? KeyboardResize.None : KeyboardResize.Native)
  }
  keyboardUp = true
  hiding = false
  showSeq += 1
  const hideChrome = () => {
    chromeHidden = true
    navHidden = true
    emit()
  }
  if (drawerSession) moveFollowedDrawers(Math.round(keyboardHeight), KEYBOARD_SHOW, hideChrome)
  else hideChrome()
}

function onWillHide() {
  if (!keyboardUp || hiding) return
  hiding = true
  if (drawerSession) moveFollowedDrawers(0, KEYBOARD_HIDE, releaseChrome)
  // The shrink was cancelled before it landed: there is no restore to wait for.
  else if (isFullHeight()) releaseNav()
}

function onResize() {
  const height = window.innerHeight
  if (!keyboardUp) {
    restingHeight = Math.max(restingHeight, height)
    return
  }
  if (drawerSession && !hiding && height < restingHeight - 1) {
    // The mode switch lost the race against the plugin's resize: hand the
    // drawers to the native layout and keep `native` so the restore works.
    drawerSession = false
    setResizeMode(KeyboardResize.Native)
    dropFollowedDrawers()
    return
  }
  if (hiding && !drawerSession && height >= restingHeight - 1) releaseNav()
}

function onDidHide() {
  // A keyboardWillShow after the matching willHide supersedes this event.
  if (!hiding) return
  keyboardUp = false
  hiding = false
  if (chromeHidden || navHidden) {
    chromeHidden = false
    navHidden = false
    emit()
  }
  if (drawerSession) {
    drawerSession = false
    setResizeMode(KeyboardResize.Native)
  }
}

function releaseChrome() {
  const drawerClosing = document.querySelector('[data-vaul-drawer][data-state="closed"]') !== null
  if (!navHidden && (drawerClosing || !chromeHidden)) return
  navHidden = false
  if (!drawerClosing) chromeHidden = false
  emit()
}

function releaseNav() {
  if (!navHidden) return
  navHidden = false
  emit()
}

function emit() {
  listeners.forEach((listener) => listener())
}

function isFullHeight() {
  return window.innerHeight >= restingHeight - 1
}

function setResizeMode(mode: KeyboardResize) {
  if (mode === resizeMode) return
  resizeMode = mode
  void Keyboard.setResizeMode({ mode }).catch(() => {})
}
