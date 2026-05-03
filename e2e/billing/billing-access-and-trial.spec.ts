import { expect, test } from '@playwright/test'
import { BillingPage } from '../pages/BillingPage'
import { mockBillingDefaults, mockSubscriptionSummary } from '../fixtures/billing-mocks'
import {
  makeTestUser,
  mockAuthMe,
  registerViaApi,
  setupAuthenticatedOwner,
} from '../fixtures/test-helpers'
import { LoginPage } from '../pages/LoginPage'

// Notes on the strategy used in this file:
//
// Real backend covers: registration, login, JWT/cookie session.
// Mocked endpoints: /api/auth/me (so we can pretend the wizard was completed
// without needing plan + Stripe seeding in the test DB), and the entire
// billing surface (subscription-summary, billing-details, sms, invoices).
// The real backend's /billing endpoints would 500 without a BASE plan + a
// Stripe test key in .env.test — see plan file for the seeding question.

test.describe('Billing tab access', () => {
  test('owner who has not completed the wizard cannot reach the Billing surface', async ({
    page,
    request,
  }) => {
    const user = makeTestUser()
    await registerViaApi(request, user)

    // No mockAuthMe call → real /auth/me returns wizardCompleted=false, so
    // SettingsPage gates the billing tab off (`canAccessBilling=false`).
    const login = new LoginPage(page)
    await login.goto()
    await login.login(user.email, user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 15_000,
    })

    // Force-navigate to billing. SettingsPage's getInitialTab silently swaps
    // to 'profile' for gated users (without rewriting the URL), so the URL
    // can stay at ?tab=billing — what matters is that the billing surface
    // does not render and the billing tab trigger is absent.
    await page.goto('/account?tab=billing')

    // No billing trigger in the tab list
    await expect(
      page.getByRole('tab', { name: /Billing/i }),
    ).toHaveCount(0)
    // No billing surface rendered
    await expect(page.locator('.bv2-hero')).toHaveCount(0)
  })

  test('owner with completed wizard sees the Billing tab and lands on the billing surface', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, { state: 'trial' })
    await setupAuthenticatedOwner(page, request)

    const billing = new BillingPage(page)
    await billing.goto()

    await expect(page).toHaveURL(/\/account\?tab=billing/)
    await expect(billing.heroBand).toBeVisible()
  })
})

test.describe('Trial state', () => {
  test('hero shows trial pill, days remaining and the upgrade CTA', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, { state: 'trial' })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 5 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Trial/i)
    await expect(page.getByText(/days left in trial/i)).toBeVisible()
    await expect(billing.upgradeHeroButton).toBeVisible()
    await expect(billing.upgradeHeroButton).toContainText(/Upgrade/i)
  })

  test('subscription card shows trial banner with the progress bar and total-after-trial line', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      summary: { basePlanPrice: 19.99, pricePerTeamMember: 5 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(page.getByText(/Trial ends in/i)).toBeVisible()
    await expect(page.locator('.bv2-trial-strip')).toBeVisible()
    await expect(page.getByText(/Total after trial/i)).toBeVisible()
    // Stepper enabled during trial
    await expect(billing.seatStepperIncrement).toBeEnabled()
  })

  test('SMS card is locked during trial', async ({ page, request }) => {
    await mockBillingDefaults(page, { state: 'trial' })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.smsLockedBanner).toBeVisible()
    // No buy button while locked
    await expect(billing.smsBuyButton).toHaveCount(0)
  })

  test('plan & usage card shows unlimited team seats during trial', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, { state: 'trial' })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    // The team-seats tile shows the infinity glyph during trial
    await expect(page.locator('.bv2-figure').filter({ hasText: '∞' }).first()).toBeVisible()
  })
})
