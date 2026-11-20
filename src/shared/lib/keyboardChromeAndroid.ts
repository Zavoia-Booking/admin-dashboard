import { Keyboard } from "@capacitor/keyboard"
import { flushSync } from "react-dom"
import { getNativePlatform } from "../../app/config/env"
import { keepScrollerInPlace, releaseSpacers } from "./keyboardChrome"

/**
 * Android soft-keyboard state behind useKeyboardVisible.
 *
 * The SafeArea plugin resizes the page for the keyboard as its animation
 * starts, so bottom chrome hides on keyboardWillShow and returns once the page
 * is back at full height: behind the keyboard that is still sliding away, not
 * after keyboardDidHide. A page that shrank and is full height again always
 * releases the chrome, so a keyboard that left without its hide events can't
 * keep it hidden.
 */

let hidden = false
// Bumped on every keyboardWillShow; a consumer mounted while the keyboard is up stays visible until the next one.
let showSeq = 1
// keyboardWillShow until keyboardDidHide.
let keyboardUp = false
// The page has been below its resting height since keyboardWillShow.
let shrunk = false
let restingHeight = 0
let restingWidth = 0
const listeners = new Set<() => void>()

export function subscribeAndroidKeyboardChrome(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

export const getAndroidKeyboardShowSeq = () => showSeq
export const getAndroidKeyboardSnapshot = () => (hidden ? showSeq : 0)

export function wireKeyboardChromeAndroid() {
  if (getNativePlatform() !== "android") return

  rememberRestingSize()
  void Keyboard.addListener("keyboardWillShow", onWillShow).catch(() => {})
  void Keyboard.addListener("keyboardWillHide", onWillHide).catch(() => {})
  void Keyboard.addListener("keyboardDidHide", onDidHide).catch(() => {})
  window.addEventListener("resize", onResize)
  document.addEventListener("visibilitychange", releaseIfGrownBack)
}

function onWillShow() {
  keyboardUp = true
  shrunk = !isFullHeight()
  showSeq += 1
  // Same end-space trick as iOS, so a scroller at its end doesn't drop when the footer hides.
  keepScrollerInPlace(() =>
    flushSync(() => {
      hidden = true
      emit()
    }),
  )
}

function onWillHide() {
  // The page is resized before this event, so it may already be full height.
  if (isFullHeight()) release()
  else shrunk = true
}

function onResize() {
  if (hidden) {
    if (isFullHeight()) releaseIfGrownBack()
    else shrunk = true
    return
  }
  if (keyboardUp) return
  // Only grows at a given width: a shrink may be the keyboard arriving ahead of keyboardWillShow.
  if (window.innerWidth !== restingWidth) rememberRestingSize()
  else restingHeight = Math.max(restingHeight, window.innerHeight)
}

function onDidHide() {
  keyboardUp = false
  release()
}

function releaseIfGrownBack() {
  if (hidden && shrunk && isFullHeight()) release()
}

function release() {
  if (!hidden) return
  releaseSpacers()
  flushSync(() => {
    hidden = false
    emit()
  })
}

function rememberRestingSize() {
  restingHeight = window.innerHeight
  restingWidth = window.innerWidth
}

function isFullHeight() {
  return window.innerWidth === restingWidth && window.innerHeight >= restingHeight - 1
}

function emit() {
  listeners.forEach((listener) => listener())
}
