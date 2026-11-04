import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Keyboard } from '@capacitor/keyboard'
import { getNativePlatform, isNativeApp } from '../../app/config/env'
import {
  getKeyboardChromeSnapshot,
  getKeyboardNavSnapshot,
  getKeyboardShowSeq,
  subscribeKeyboardChrome,
} from '../lib/keyboardChrome'

/**
 * Android (and web, where it stays false): true from keyboardWillShow until
 * keyboardDidHide, tracked per instance.
 */
function useKeyboardEvents() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isNativeApp()) return
    const show = Keyboard.addListener('keyboardWillShow', () => setVisible(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false))
    return () => {
      void show.then(h => h.remove()).catch(() => {})
      void hide.then(h => h.remove()).catch(() => {})
    }
  }, [])

  return visible
}

const serverSnapshot = () => false

function useIosKeyboardFlag(getSnapshot: () => number) {
  const [mountSeq] = useState(getKeyboardShowSeq)
  // A boolean per instance, so a keyboardWillShow that changes nothing for
  // this consumer doesn't re-render it.
  const getHidden = useCallback(() => {
    const seq = getSnapshot()
    return seq !== 0 && seq !== mountSeq
  }, [getSnapshot, mountSeq])
  return useSyncExternalStore(subscribeKeyboardChrome, getHidden, serverSnapshot)
}

function useIosKeyboardVisible() {
  return useIosKeyboardFlag(getKeyboardChromeSnapshot)
}

function useIosKeyboardVisibleForNav() {
  return useIosKeyboardFlag(getKeyboardNavSnapshot)
}

const isIos = getNativePlatform() === 'ios'

/**
 * True while the native on-screen keyboard is visible. Always false on web.
 * Used to hide bottom-anchored chrome (tab bar, drawer and slider footers)
 * that would otherwise ride up on top of the keyboard when the WebView resizes.
 *
 * Goes true on keyboardWillShow and false on keyboardDidHide, except on iOS
 * when a field inside a bottom drawer had the keyboard: the drawer then glides
 * down with the keyboard, so its footer returns at keyboardWillHide unless the
 * drawer is sliding out (shared/lib/keyboardChrome.ts).
 */
export const useKeyboardVisible: () => boolean = isIos ? useIosKeyboardVisible : useKeyboardEvents

/**
 * useKeyboardVisible for the bottom tab bar. On iOS the bar returns as soon as
 * it can't paint at the keyboard's top edge: at keyboardWillHide after a drawer
 * field, otherwise once the web view has grown back — so it is there when a
 * drawer closes instead of after keyboardDidHide.
 */
export const useKeyboardVisibleForNav: () => boolean = isIos ? useIosKeyboardVisibleForNav : useKeyboardEvents
