import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'
import type { AppleCredential } from '../types'

/**
 * Sign in with Apple through @capgo/capacitor-social-login:
 * - iOS app: the native Apple sheet;
 * - web: Apple JS in a popup.
 * Never offered in the Android app.
 *
 * The API checks the identity token's nonce claim against SHA-256 of the raw
 * nonce, so Apple gets the hash and the API gets the raw value.
 *
 * Web popups: browsers only allow a popup opened close to the click. Loading
 * Apple JS and hashing the nonce are both async, so prepareAppleSignIn() does
 * them ahead of time (button mount); the click then reaches Apple JS without
 * waiting on either.
 */

type ApplePlatform = 'ios' | 'web'

const servicesId = (): string | undefined => import.meta.env.VITE_APPLE_SERVICES_ID || undefined
const webRedirectUri = (): string | undefined => import.meta.env.VITE_APPLE_REDIRECT_URI || undefined

function currentPlatform(): ApplePlatform | null {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return 'ios'
  if (platform === 'android') return null
  return 'web'
}

/** Whether the Apple button should render at all on this platform/build. */
export function isAppleSignInAvailable(): boolean {
  const platform = currentPlatform()
  if (platform === 'ios') return true
  if (platform === 'web') return !!servicesId() && !!webRedirectUri()
  return false
}

// ---- plugin initialisation (once) ----

let initPromise: Promise<void> | null = null
let initialized = false

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const platform = currentPlatform()
      if (platform === 'web') {
        const clientId = servicesId()
        const redirectUrl = webRedirectUri()
        if (!clientId || !redirectUrl) throw new Error('apple_not_configured')
        // useProperTokenExchange: without it the plugin returns no authorizationCode.
        await SocialLogin.initialize({ apple: { clientId, redirectUrl, useProperTokenExchange: true } })
      } else if (platform === 'ios') {
        // No redirectUrl on iOS: with one, the plugin posts the result to that URL itself.
        await SocialLogin.initialize({ apple: { useProperTokenExchange: true } })
      } else {
        throw new Error('apple_not_available')
      }
      initialized = true
    })().catch((error) => {
      initPromise = null
      throw error
    })
  }
  return initPromise
}

// ---- nonce (one per attempt, prepared in advance) ----

type NoncePair = { raw: string; hashed: string }

let readyNonce: NoncePair | null = null
let noncePromise: Promise<NoncePair> | null = null

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toHex(new Uint8Array(digest))
}

function prepareNonce(): Promise<NoncePair> {
  if (!noncePromise) {
    noncePromise = (async () => {
      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      const raw = toHex(bytes)
      const pair = { raw, hashed: await sha256Hex(raw) }
      readyNonce = pair
      return pair
    })().catch((error) => {
      noncePromise = null
      throw error
    })
  }
  return noncePromise
}

/** Hands out the prepared nonce once; the next attempt gets a fresh one. */
function takeNonce(): NoncePair | null {
  const pair = readyNonce
  if (pair) {
    readyNonce = null
    noncePromise = null
  }
  return pair
}

/** Loads Apple JS (web) / initialises the plugin and prepares a nonce. Safe to call repeatedly. */
export async function prepareAppleSignIn(): Promise<void> {
  await Promise.all([ensureInitialized(), prepareNonce()])
}

/** The user closed the Apple sheet or popup — not an error worth surfacing. */
export function isAppleSignInCancel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String((error as { error?: unknown })?.error ?? error ?? '')
  const code = (error as { code?: unknown } | null)?.code
  // iOS rejects with code USER_CANCELLED; Apple JS reports popup_closed_by_user
  // or user_cancelled_authorize.
  return code === 'USER_CANCELLED' || /cancel/i.test(message) || /popup_closed/i.test(message)
}

const cleanName = (value: string | null | undefined): string | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed ? trimmed : undefined
}

/**
 * Runs Apple's sign-in UI and returns the credential the API's Apple endpoints
 * take. Rejects on cancel (see isAppleSignInCancel) and on failure.
 */
export async function appleSignIn(): Promise<AppleCredential> {
  const platform = currentPlatform()
  if (!platform) throw new Error('apple_not_available')

  // Prepared in advance: nothing below waits before Apple JS opens its popup.
  let nonce = initialized ? takeNonce() : null
  if (!nonce) {
    await prepareAppleSignIn()
    nonce = takeNonce()
  }
  if (!nonce) throw new Error('apple_nonce_unavailable')
  // Get the next attempt's nonce ready (e.g. after a cancel).
  void prepareNonce().catch(() => {})

  // Scopes only on the web (Apple JS takes 'name email'). On iOS the plugin casts
  // them straight to ASAuthorization.Scope, whose full-name value is 'full_name',
  // so 'name' would silently drop the name; without scopes it requests full name
  // and email itself (AppleProvider.swift: requestedScopes = [.fullName, .email]).
  const { result } = await SocialLogin.login({
    provider: 'apple',
    options: Capacitor.getPlatform() === 'ios' ? { nonce: nonce.hashed } : { scopes: ['name', 'email'], nonce: nonce.hashed },
  })

  const authorizationCode = result.authorizationCode
  const identityToken = result.idToken
  if (!authorizationCode || !identityToken) throw new Error('apple_no_credential')

  const firstName = cleanName(result.profile?.givenName)
  const lastName = cleanName(result.profile?.familyName)
  const redirectUri = platform === 'web' ? webRedirectUri() : undefined

  return {
    platform,
    authorizationCode,
    identityToken,
    nonce: nonce.raw,
    ...(redirectUri ? { redirectUri } : {}),
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
  }
}
