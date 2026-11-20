import { useCallback, useState, useSyncExternalStore } from 'react'
import { getNativePlatform } from '../../app/config/env'
import {
  getKeyboardChromeSnapshot,
  getKeyboardNavSnapshot,
  getKeyboardShowSeq,
  subscribeKeyboardChrome,
} from '../lib/keyboardChrome'
import {
  getAndroidKeyboardShowSeq,
  getAndroidKeyboardSnapshot,
  subscribeAndroidKeyboardChrome,
} from '../lib/keyboardChromeAndroid'

const serverSnapshot = () => false

/** Android: the shared state in shared/lib/keyboardChromeAndroid.ts, as a boolean per instance. */
function useAndroidKeyboardVisible() {
  const [mountSeq] = useState(getAndroidKeyboardShowSeq)
  const getHidden = useCallback(() => {
    const seq = getAndroidKeyboardSnapshot()
    return seq !== 0 && seq !== mountSeq
  }, [mountSeq])
  return useSyncExternalStore(subscribeAndroidKeyboardChrome, getHidden, serverSnapshot)
}

const useNoKeyboard = () => false

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

const platform = getNativePlatform()

/**
 * True while the native on-screen keyboard is visible. Always false on web.
 * Used to hide bottom-anchored chrome (tab bar, drawer and slider footers)
 * that would otherwise ride up on top of the keyboard when the WebView resizes.
 *
 * Goes true on keyboardWillShow. iOS: false on keyboardDidHide, except when a
 * field inside a bottom drawer had the keyboard: the drawer then glides down
 * with the keyboard, so its footer returns at keyboardWillHide unless the
 * drawer is sliding out (shared/lib/keyboardChrome.ts). Android: false once the
 * page has grown back as the keyboard starts closing.
 */
export const useKeyboardVisible: () => boolean =
  platform === 'ios' ? useIosKeyboardVisible : platform === 'android' ? useAndroidKeyboardVisible : useNoKeyboard

/**
 * useKeyboardVisible for the bottom tab bar. On iOS the bar returns as soon as
 * it can't paint at the keyboard's top edge: at keyboardWillHide after a drawer
 * field, otherwise once the web view has grown back — so it is there when a
 * drawer closes instead of after keyboardDidHide. Android: same as the footers.
 */
export const useKeyboardVisibleForNav: () => boolean =
  platform === 'ios' ? useIosKeyboardVisibleForNav : platform === 'android' ? useAndroidKeyboardVisible : useNoKeyboard
