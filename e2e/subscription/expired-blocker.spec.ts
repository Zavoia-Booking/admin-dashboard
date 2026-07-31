/**
 * Expired trial / expired subscription behavior matrix.
 *
 * Web (desktop + mobile viewport): a full-screen SubscriptionBlocker must
 * cover every app route except the allowlisted ones (/account for owners,
 * /support, legal pages) so the owner can still reach billing and renew.
 *
 * Capacitor (native container): NO blocker — store policy forbids
 * subscription friction — the app stays browsable (reads work) but write
 * requests are rejected by the backend guard with 402 subscription_required
 * and the UI surfaces the read-only toast/banner.
 *
 * The trial-expired scenarios are fully real: the business's trialEndsAt is
 * pushed into the past in the DB, so the real /auth/me reports entitled=false
 * and the real SubscriptionGuard rejects writes. Only the "was on a paid
 * subscription, now canceled/expired" billing surface is mocked (Stripe clock
 * skipping can't be reproduced locally).
 *
 * Screenshots land in admin-dashboard/e2e-screenshots/.
 */

import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { registerOwnerSession, type ApiSession } from '../fixtures/reconciliation-seed'
import { createManualCustomerViaApi } from '../fixtures/customers-seed'
import { expireBusinessTrial, markWizardComplete } from '../fixtures/test-db'
import { mockBillingDefaults } from '../fixtures/billing-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'
import { LoginPage } from '../pages/LoginPage'

const SCREENSHOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'e2e-screenshots')
mkdirSync(SCREENSHOT_DIR, { recursive: true })

const shot = (page: Page, name: string) =>
  page.screenshot({ path: resolve(SCREENSHOT_DIR, `${name}.png`), fullPage: false })

const BLOCKER_TITLE = 'Your subscription has ended'
const READONLY_BANNER = 'Limited access: Some features are unavailable on your current plan.'

/** Routes that must be covered by the blocker on web when not entitled. */
const BLOCKED_ROUTES = [
  '/dashboard',
  '/calendar',
  '/locations',
  '/services',
  '/assignments',
  '/team-members',
  '/customers',
  '/website',
  '/notifications',
]

async function seedExpiredTrialOwner(): Promise<ApiSession> {
  const owner = await registerOwnerSession()
  await markWizardComplete(owner.userId)
  await expireBusinessTrial(owner.businessId)
  return owner
}

async function loginAsOwner(page: Page, owner: ApiSession): Promise<void> {
  const login = new LoginPage(page)
  await login.goto()
  await login.login(owner.user.email, owner.user.password)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
}

const blocker = (page: Page) => page.getByText(BLOCKER_TITLE)

/** Simulates the Capacitor native container: config.IS_NATIVE reads
 * window.Capacitor.isNativePlatform() at module init, so the stub must be
 * installed before any app script runs. */
async function simulateCapacitor(page: Page): Promise<void> {
  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
      Plugins: {},
    }
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Web desktop
// ────────────────────────────────────────────────────────────────────────────

test.describe('expired trial — web desktop', () => {
  test('blocker covers every app route; /account and /support stay reachable', async ({ page }) => {
    const owner = await seedExpiredTrialOwner()
    await loginAsOwner(page, owner)

    for (const route of BLOCKED_ROUTES) {
      await page.goto(route)
      await expect(blocker(page), `blocker missing on ${route}`).toBeVisible({ timeout: 10_000 })
    }
    await page.goto('/dashboard')
    await expect(blocker(page)).toBeVisible()
    await shot(page, 'web-expired-blocker-dashboard')
    await page.goto('/customers')
    await expect(blocker(page)).toBeVisible()
    await shot(page, 'web-expired-blocker-customers')

    // Owner must still reach billing to renew, and support to get help.
    await page.goto('/account?tab=billing')
    await expect(blocker(page)).toHaveCount(0)
    await page.waitForLoadState('networkidle')
    await shot(page, 'web-expired-account-billing-allowed')

    await page.goto('/support')
    await expect(blocker(page)).toHaveCount(0)
  })

  test('blocker CTA navigates to billing', async ({ page }) => {
    const owner = await seedExpiredTrialOwner()
    await loginAsOwner(page, owner)

    await page.goto('/dashboard')
    await expect(blocker(page)).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'Renew subscription' }).click()
    await page.waitForURL(/\/account\?tab=billing/)
    await expect(blocker(page)).toHaveCount(0)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Web mobile viewport
// ────────────────────────────────────────────────────────────────────────────

test.describe('expired trial — web mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('blocker shows on mobile web and billing stays reachable', async ({ page }) => {
    const owner = await seedExpiredTrialOwner()
    await loginAsOwner(page, owner)

    await page.goto('/dashboard')
    await expect(blocker(page)).toBeVisible({ timeout: 10_000 })
    await shot(page, 'mobile-expired-blocker-dashboard')

    await page.goto('/customers')
    await expect(blocker(page)).toBeVisible()
    await shot(page, 'mobile-expired-blocker-customers')

    await page.goto('/account?tab=billing')
    await expect(blocker(page)).toHaveCount(0)
    await page.waitForLoadState('networkidle')
    await shot(page, 'mobile-expired-account-billing')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Capacitor
// ────────────────────────────────────────────────────────────────────────────

test.describe('expired trial — capacitor', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('no blocker: app stays browsable, reads work, writes are rejected with 402', async ({ page }) => {
    // Seed data BEFORE expiring the trial — afterwards writes are rejected.
    const owner = await registerOwnerSession()
    await markWizardComplete(owner.userId)
    const existing = await createManualCustomerViaApi(owner, {
      firstName: 'Read',
      lastName: 'Only',
      email: `readonly-${Date.now()}@test.com`,
    })
    await expireBusinessTrial(owner.businessId)

    await simulateCapacitor(page)
    await loginAsOwner(page, owner)

    // App renders, no blocker, and the read-only banner explains the state.
    await page.goto('/dashboard')
    await expect(blocker(page)).toHaveCount(0)
    await expect(page.getByText(READONLY_BANNER).first()).toBeVisible({ timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await shot(page, 'capacitor-expired-dashboard')

    // Reads still work: the customers list loads real data.
    await page.goto('/customers')
    await expect(blocker(page)).toHaveCount(0)
    await expect(page.getByText('Read Only')).toBeVisible({ timeout: 10_000 })
    await shot(page, 'capacitor-expired-customers')

    // Write affordances are proactively disabled (WriteGate): the Add
    // Customer button is inert, so no write ever leaves the UI. The banner
    // explains the read-only state.
    const addButton = page.getByRole('button', { name: 'Add Customer' }).first()
    await expect(addButton).toBeDisabled()
    await expect(addButton).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByText(READONLY_BANNER).first()).toBeVisible()
    await shot(page, 'capacitor-write-controls-disabled')

    // Backend-level confirmation. The UI login above evicted the seed
    // session's tokens (one session slot per user+platform), so mint a fresh
    // API session first — this in turn evicts the page session, hence these
    // checks run last.
    const relogin = await owner.ctx.post('/api/auth/login', {
      data: { email: owner.user.email, password: owner.user.password },
    })
    expect(relogin.ok()).toBe(true)
    const fresh = await relogin.json()
    const freshHeaders = {
      Authorization: `Bearer ${fresh.accessToken}`,
      'X-CSRF-Token': fresh.csrfToken,
    }

    // The write POST is a hard 402 subscription_required…
    const res = await owner.ctx.post('/api/business-customers/add-manually', {
      headers: freshHeaders,
      data: { firstName: 'Hard', lastName: 'Blocked' },
    })
    expect(res.status()).toBe(402)
    const body = await res.json()
    expect(body.code).toBe('subscription_required')

    // …while a read POST (list is @ReadOperation) still succeeds.
    const listRes = await owner.ctx.post('/api/business-customers/list', {
      headers: freshHeaders,
      data: { filters: [], pagination: { offset: 0, limit: 20 } },
    })
    expect(listRes.ok()).toBe(true)
    const listBody = await listRes.json()
    expect(listBody.data.some((c: { id: number }) => c.id === existing.id)).toBe(true)
  })

  test('other app routes render without the blocker', async ({ page }) => {
    const owner = await seedExpiredTrialOwner()
    await simulateCapacitor(page)
    await loginAsOwner(page, owner)

    for (const route of ['/calendar', '/services', '/team-members', '/account']) {
      await page.goto(route)
      await expect(blocker(page), `blocker must not render on capacitor at ${route}`).toHaveCount(0)
    }
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    await shot(page, 'capacitor-expired-calendar')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Subscription expired after cancellation (Stripe states — mocked)
// ────────────────────────────────────────────────────────────────────────────

test.describe('expired subscription (canceled) — mocked billing surface', () => {
  test('web shows the blocker and the billing page renders the canceled state', async ({ page, request }) => {
    await mockBillingDefaults(page, { state: 'canceled' })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: {
          entitled: false,
          status: 'expired',
          daysRemaining: 0,
          reason: 'subscription_expired',
        },
        subscription: { status: 'canceled', trialEndsAt: null, currentPeriodEnd: null },
      },
    })

    await page.goto('/dashboard')
    await expect(blocker(page)).toBeVisible({ timeout: 10_000 })
    await shot(page, 'web-subscription-canceled-blocker')

    await page.goto('/account?tab=billing')
    await expect(blocker(page)).toHaveCount(0)
    await page.waitForLoadState('networkidle')
    await shot(page, 'web-subscription-canceled-billing')
  })
})
