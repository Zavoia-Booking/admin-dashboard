import { SocialLogin } from '@capgo/capacitor-social-login'

/**
 * Native (Capacitor) Google sign-in via the on-device account picker.
 * Returns an ID token whose audience is the web client id (the plugin passes
 * VITE_GOOGLE_CLIENT_ID as the server client id), so the backend verifies it
 * with the same GOOGLE_CLIENT_ID it already uses for the web code flow.
 */

let initialized = false

async function ensureInitialized(): Promise<void> {
  if (initialized) return
  const webClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!webClientId) {
    throw new Error('google_not_configured')
  }
  // iOS needs its own OAuth client (type "iOS", bound to the bundle id) for the
  // native picker, while the server client id stays the web one so the ID
  // token audience still matches the backend. Android ignores these.
  const iOSClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID
  await SocialLogin.initialize({
    google: {
      webClientId,
      mode: 'online',
      ...(iOSClientId ? { iOSClientId, iOSServerClientId: webClientId } : {}),
    },
  })
  initialized = true
}

/** The user closed the account picker — not an error worth surfacing. */
export function isNativeGoogleCancel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /cancel/i.test(message)
}

export async function nativeGoogleSignIn(): Promise<{ idToken: string }> {
  await ensureInitialized()
  // No `scopes`: the default Credential Manager flow already returns an ID
  // token with email/profile claims. Passing scopes switches the plugin to an
  // authorization flow that requires a modified MainActivity.
  const { result } = await SocialLogin.login({
    provider: 'google',
    options: {},
  })
  if (result.responseType !== 'online' || !result.idToken) {
    throw new Error('no_id_token')
  }
  return { idToken: result.idToken }
}
