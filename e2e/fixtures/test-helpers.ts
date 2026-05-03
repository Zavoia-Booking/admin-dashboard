import { randomUUID } from 'node:crypto'
import type { APIRequestContext, Page, Route } from '@playwright/test'
import { request } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

export const VALID_PASSWORD = 'Test123!@#'

export interface TestUser {
  email: string
  password: string
  firstName: string
  lastName: string
}

export function makeTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = randomUUID().slice(0, 8)
  return {
    email: `e2e-${id}@test.com`,
    password: VALID_PASSWORD,
    firstName: 'E2E',
    lastName: `User${id}`,
    ...overrides,
  }
}

export async function registerViaApi(
  ctx: APIRequestContext,
  user: TestUser,
): Promise<void> {
  const res = await ctx.post('/api/auth/register-business-owner', {
    data: {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  })
  if (!res.ok()) {
    throw new Error(
      `registerViaApi failed: ${res.status()} ${await res.text()}`,
    )
  }
}

export const APP_BASE_URL = 'http://localhost:5174'

export async function withApiContext<T>(
  fn: (ctx: APIRequestContext) => Promise<T>,
): Promise<T> {
  const ctx = await request.newContext({
    baseURL: APP_BASE_URL,
  })
  try {
    return await fn(ctx)
  } finally {
    await ctx.dispose()
  }
}

export async function logFailingResponse(page: Page, predicate: (url: string) => boolean = () => true): Promise<void> {
  page.on('response', async (response) => {
    if (predicate(response.url()) && response.status() >= 400) {
      console.log(
        `[e2e] ${response.status()} ${response.request().method()} ${response.url()}`,
      )
    }
  })
}

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

export type AuthMeOverrides = {
  businessId?: number
  wizardCompleted?: boolean
  countryCode?: string
  businessCurrency?: string
  entitlements?: {
    entitled?: boolean
    status?: 'trial' | 'active' | 'expired' | 'no_subscription' | 'past_due' | 'ltd' | null
    daysRemaining?: number
    maxLocations?: number
    maxTeamMembers?: number
    paidTeamSeats?: number
    usedSeats?: number
    reason?: string
  }
  subscription?: {
    status?: string | null
    planTier?: string | null
    planName?: string | null
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
    trialEndsAt?: string | null
  }
}

/**
 * Mocks `GET /api/auth/me` so the dashboard treats the current user as an
 * owner who has completed the wizard. Use after `registerViaApi` so the
 * cookies/tokens are real (refresh works), but the user shape served to the
 * UI carries `wizardCompleted: true`, a `businessId`, and the entitlements
 * shape required to render the billing surface.
 *
 * Override fields per-test (e.g. trial vs active vs ltd entitlements) so
 * `deriveViewState` in BillingAndSubscriptionV2 lands on the intended branch.
 */
export async function mockAuthMe(
  page: Page,
  overrides: AuthMeOverrides = {},
): Promise<void> {
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const body = {
    id: 1,
    email: 'owner@test.com',
    firstName: 'E2E',
    lastName: 'Owner',
    role: 'owner',
    businessId: overrides.businessId ?? 1,
    wizardCompleted: overrides.wizardCompleted ?? true,
    emailVerified: true,
    business: {
      id: overrides.businessId ?? 1,
      name: 'E2E Test Salon',
      logo: null,
      countryCode: overrides.countryCode ?? 'ro',
      businessCurrency: overrides.businessCurrency ?? 'ron',
      phone: '+40700000000',
    },
    subscription: {
      status: null,
      planTier: 'BASE',
      planName: 'Base',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEndsAt,
      ...overrides.subscription,
    },
    entitlements: {
      entitled: true,
      status: 'trial',
      daysRemaining: 7,
      maxLocations: 5,
      maxTeamMembers: 0,
      paidTeamSeats: 0,
      usedSeats: 0,
      ...overrides.entitlements,
    },
  }

  await page.route('**/api/auth/me', (route) => json(route, 200, body))
}

/**
 * Composite helper: creates a real user (real DB row, real cookies after
 * UI login), sets up the auth/me mock so the user appears wizard-completed
 * with the requested entitlements, and logs in via the UI so the page
 * has a hydrated session.
 *
 * The caller is expected to set up any billing-specific mocks before the
 * eventual `page.goto('/account?tab=billing')`.
 */
export async function setupAuthenticatedOwner(
  page: Page,
  apiContext: APIRequestContext,
  options: { user?: TestUser; authMe?: AuthMeOverrides } = {},
): Promise<TestUser> {
  const user = options.user ?? makeTestUser()
  await registerViaApi(apiContext, user)
  await mockAuthMe(page, options.authMe ?? {})

  const login = new LoginPage(page)
  await login.goto()
  await login.login(user.email, user.password)
  // Wait for the post-login redirect — landing target depends on auth state,
  // but as long as we're off /login, the session is established.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  })

  return user
}
