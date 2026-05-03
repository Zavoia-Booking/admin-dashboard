import type { Page, Route } from '@playwright/test'

const SAMPLE_TOKENS = {
  accessToken: 'mock-access-token',
  csrfToken: 'mock-csrf-token',
}

export const sampleUser = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  uuid: 'mock-uuid',
  email: 'mocked@test.com',
  firstName: 'Mocked',
  lastName: 'User',
  role: 'owner',
  businessId: null,
  wizardCompleted: false,
  ...overrides,
})

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

/**
 * Pre-set the OAuth context flag the GoogleOAuthCallback component reads from sessionStorage.
 * Must run before navigating to /auth/callback.
 */
export async function presetOauthContext(
  page: Page,
  context: 'login' | 'register',
): Promise<void> {
  await page.addInitScript((ctx) => {
    sessionStorage.setItem('oauthContext', ctx)
  }, context)
}

/**
 * Mocks both the Google authorization-code exchange (`POST /auth/google`)
 * and the follow-up `GET /auth/me` so the callback flow has a full payload.
 */
export async function mockGoogleAuth(
  page: Page,
  options: {
    behavior:
      | 'login_success_wizard_complete'
      | 'login_success_new_owner'
      | 'register_success_new_owner'
      | 'account_disabled'
      | 'scheduled_for_deletion'
    user?: Record<string, unknown>
  },
): Promise<void> {
  const baseUser = options.user ?? {}

  await page.route('**/api/auth/google', async (route) => {
    switch (options.behavior) {
      case 'login_success_wizard_complete':
        return json(route, 200, {
          ...SAMPLE_TOKENS,
          user: sampleUser({ ...baseUser, wizardCompleted: true, businessId: 1 }),
          isNewUser: false,
        })
      case 'login_success_new_owner':
        return json(route, 200, {
          ...SAMPLE_TOKENS,
          user: sampleUser({ ...baseUser, wizardCompleted: false }),
          isNewUser: false,
        })
      case 'register_success_new_owner':
        return json(route, 200, {
          ...SAMPLE_TOKENS,
          user: sampleUser({ ...baseUser, wizardCompleted: false }),
          isNewUser: true,
        })
      case 'account_disabled':
        return json(route, 200, {
          ...SAMPLE_TOKENS,
          user: sampleUser({ ...baseUser }),
          accountDisabled: true,
        })
      case 'scheduled_for_deletion':
        return json(route, 200, {
          ...SAMPLE_TOKENS,
          user: sampleUser({ ...baseUser }),
          accountScheduledForDeletion: true,
          deletionScheduledAt: '2026-12-31T00:00:00.000Z',
        })
    }
  })

  await page.route('**/api/auth/me', async (route) =>
    json(
      route,
      200,
      sampleUser({
        ...baseUser,
        wizardCompleted:
          options.behavior === 'login_success_wizard_complete' ? true : false,
        businessId:
          options.behavior === 'login_success_wizard_complete' ? 1 : null,
      }),
    ),
  )
}

/**
 * Forces /auth/login to return the 300 + business_selection_required shape
 * the saga handles, then provides a select-business success response.
 */
export async function mockBusinessSelectorLogin(
  page: Page,
  businesses: Array<{ id: number; name: string; role: string }>,
): Promise<void> {
  await page.route('**/api/auth/login', async (route) =>
    json(route, 300, {
      code: 'business_selection_required',
      details: {
        selectionToken: 'mock-selection-token',
        businesses,
      },
    }),
  )

  await page.route('**/api/auth/select-business', async (route) => {
    const body = route.request().postDataJSON() as {
      selectionToken: string
      businessId: number
    }
    const business = businesses.find((b) => b.id === body.businessId)
    if (!business) return json(route, 400, { message: 'invalid business' })
    return json(route, 200, {
      ...SAMPLE_TOKENS,
      user: sampleUser({
        wizardCompleted: true,
        businessId: business.id,
        role: business.role,
      }),
    })
  })

  await page.route('**/api/auth/me', async (route) =>
    json(route, 200, sampleUser({ wizardCompleted: true, businessId: businesses[0].id })),
  )
}

export async function mockResetPassword(
  page: Page,
  options: { token: string; behavior: 'success' | 'invalid' },
): Promise<void> {
  await page.route('**/api/auth/reset-password*', async (route) => {
    const url = new URL(route.request().url())
    const token = url.searchParams.get('token')
    if (token !== options.token || options.behavior === 'invalid') {
      return json(route, 400, { message: 'AUTH.E_INVALID_RESET_TOKEN' })
    }
    return json(route, 200, { message: 'AUTH.S_RESET_PASSWORD' })
  })
}

export async function mockVerifyEmail(
  page: Page,
  behavior: 'success' | 'already_verified' | 'invalid' | 'no_token',
): Promise<void> {
  await page.route('**/api/auth/verify-email*', async (route) => {
    switch (behavior) {
      case 'success':
        return json(route, 200, {
          success: true,
          message: 'AUTH.S_EMAIL_VERIFIED',
        })
      case 'already_verified':
        return json(route, 200, {
          success: false,
          message: 'alreadyVerified',
        })
      case 'invalid':
        return json(route, 400, { success: false, message: 'invalidToken' })
      case 'no_token':
        return json(route, 400, { success: false, message: 'noToken' })
    }
  })
}

export async function mockTeamInvitation(
  page: Page,
  options: {
    status: 'needs_registration' | 'accepted' | 'invalid'
    business?: { id: number; name: string }
    email?: string
  },
): Promise<void> {
  const business = options.business ?? { id: 1, name: 'Acme Salon' }
  const email = options.email ?? 'invitee@test.com'

  await page.route('**/api/auth/check-team-invitation*', async (route) => {
    switch (options.status) {
      case 'needs_registration':
        return json(route, 200, {
          status: 'needs_registration',
          token: 'mock-team-invite-token',
          business,
          email,
        })
      case 'accepted':
        return json(route, 200, {
          status: 'accepted',
          message: 'Invitation already accepted',
          business,
          email,
        })
      case 'invalid':
        return json(route, 400, {
          status: 'invalid',
          message: 'Invalid invitation token',
        })
    }
  })

  await page.route('**/api/auth/complete-team-invitation', async (route) =>
    json(route, 200, {
      ...SAMPLE_TOKENS,
      user: sampleUser({
        email,
        role: 'team_member',
        wizardCompleted: true,
        businessId: business.id,
      }),
    }),
  )

  await page.route('**/api/auth/me', async (route) =>
    json(
      route,
      200,
      sampleUser({
        email,
        role: 'team_member',
        wizardCompleted: true,
        businessId: business.id,
      }),
    ),
  )
}
