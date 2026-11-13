import { createHash } from 'node:crypto'
import type { Page, Request, Route } from '@playwright/test'
import { sampleUser } from './auth-mocks'

/**
 * Sign in with Apple on the web, without Apple.
 *
 * The dashboard uses @capgo/capacitor-social-login, whose web provider loads
 * Apple JS from this URL and calls `AppleID.auth.init(config)` then
 * `AppleID.auth.signIn()`. Routing the URL to a stub that defines
 * `window.AppleID` replaces Apple's popup with a canned authorization.
 */
export const APPLE_JS_URL =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'

export const APPLE_REDIRECT_URI = 'http://localhost:5174/auth/apple/callback'
export const APPLE_SERVICES_ID = 'com.zavoia.signin.web.test'

export type AppleJsResponse = {
  authorization: { code: string; id_token: string; state?: string }
  user?: { email?: string; name?: { firstName?: string; lastName?: string } }
}

export const DEFAULT_APPLE_RESPONSE: AppleJsResponse = {
  authorization: { code: 'mock-apple-code', id_token: 'mock-apple-id-token' },
  user: { email: 'apple-user@test.com', name: { firstName: 'Ana', lastName: 'Pop' } },
}

/** What Apple JS's signIn() resolves with, or `{ error }` to reject (e.g. popup_closed_by_user). */
export async function stubAppleJs(
  page: Page,
  response: AppleJsResponse | { error: string } = DEFAULT_APPLE_RESPONSE,
): Promise<void> {
  const body = `
    window.__appleInitCalls = [];
    window.__appleSignInCalls = 0;
    window.AppleID = {
      auth: {
        init: function (config) { window.__appleInitCalls.push(config); },
        signIn: function () {
          window.__appleSignInCalls += 1;
          var r = ${JSON.stringify(response)};
          return r.error ? Promise.reject(r) : Promise.resolve(r);
        }
      }
    };
  `
  await page.route(APPLE_JS_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body }),
  )
}

export type AppleInitConfig = {
  clientId: string
  redirectURI: string
  nonce?: string
  scope?: string
  usePopup?: boolean
}

export async function appleInitCalls(page: Page): Promise<AppleInitConfig[]> {
  return page.evaluate(() => (window as unknown as { __appleInitCalls?: AppleInitConfig[] }).__appleInitCalls ?? [])
}

export async function appleSignInCalls(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __appleSignInCalls?: number }).__appleSignInCalls ?? 0)
}

export const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex')

export const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

/** API error body as the admin-api exception filter shapes it. */
export const apiError = (status: number, message: string, code?: string, details?: Record<string, unknown>) => ({
  statusCode: status,
  message: [message],
  ...(code ? { code } : {}),
  ...(details ? { details } : {}),
})

export const session = (user: Record<string, unknown>, isNewUser = false) => ({
  message: 'APPLE.S01',
  accessToken: 'mock-access-token',
  csrfToken: 'mock-csrf-token',
  user: sampleUser(user),
  isNewUser,
})

/** Records the JSON bodies POSTed to one API path, answering each with `answer`. */
export async function mockApplePost(
  page: Page,
  path: string,
  answer: (body: Record<string, any>, request: Request) => { status: number; body: unknown },
): Promise<Array<Record<string, any>>> {
  const bodies: Array<Record<string, any>> = []
  await page.route(`**/api${path}`, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    const body = (route.request().postDataJSON() ?? {}) as Record<string, any>
    bodies.push(body)
    const { status, body: responseBody } = answer(body, route.request())
    return json(route, status, responseBody)
  })
  return bodies
}

/**
 * The calls a freshly signed-in dashboard makes right away. With the fake
 * access token the real API would answer 401 and end the session, so answer
 * them here (as auth-mocks.ts does for Google).
 */
export async function mockSignedInShell(page: Page, me: Record<string, unknown>): Promise<void> {
  await page.route('**/api/auth/me', (route) => json(route, 200, sampleUser(me)))
  await page.route('**/api/business-push/locale', (route) => json(route, 200, {}))
  await page.route('**/api/wizard/draft', (route) => json(route, 200, { wizardData: {} }))
  await page.route('**/api/locations/list', (route) => json(route, 200, { locations: [] }))
}
