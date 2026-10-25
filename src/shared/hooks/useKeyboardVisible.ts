import { useEffect, useState } from 'react'
import { Keyboard } from '@capacitor/keyboard'
import { isNativeApp } from '../../app/config/env'

/**
 * True while the native on-screen keyboard is visible. Always false on web.
 * Used to hide bottom-anchored chrome (tab bar) that would otherwise ride up
 * on top of the keyboard when the WebView resizes.
 *
 * Goes true on keyboardWillShow (chrome disappears before the resize) but
 * false only on keyboardDidHide: on iOS the web view grows back during the
 * hide animation, and restoring the chrome on willHide paints it at the
 * keyboard's top edge for a frame before it drops to the real bottom.
 */
export function useKeyboardVisible() {
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
