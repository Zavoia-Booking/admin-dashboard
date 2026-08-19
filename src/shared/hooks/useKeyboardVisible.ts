import { useEffect, useState } from 'react'
import { Keyboard } from '@capacitor/keyboard'
import { isNativeApp } from '../../app/config/env'

/**
 * True while the native on-screen keyboard is visible. Always false on web.
 * Used to hide bottom-anchored chrome (tab bar) that would otherwise ride up
 * on top of the keyboard when the WebView resizes.
 */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isNativeApp()) return
    const show = Keyboard.addListener('keyboardWillShow', () => setVisible(true))
    const hide = Keyboard.addListener('keyboardWillHide', () => setVisible(false))
    return () => {
      void show.then(h => h.remove()).catch(() => {})
      void hide.then(h => h.remove()).catch(() => {})
    }
  }, [])

  return visible
}
