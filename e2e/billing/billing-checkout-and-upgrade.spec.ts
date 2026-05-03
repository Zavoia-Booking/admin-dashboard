import { expect, test } from '@playwright/test'
import { BillingPage } from '../pages/BillingPage'
import {
  mockBillingDefaults,
  mockCheckoutEndpoint,
} from '../fixtures/billing-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Stripe checkout is an external redirect — we never let the navigation
// actually happen. Instead, we intercept the route and assert that the app
// requested a checkout session with the expected payload, then prevent the
// page from leaving the dev origin so subsequent assertions can still run.

const STUB_CHECKOUT_URL = 'http://localhost:5174/account?stripe-stub-checkout'

test.describe('Upgrade & checkout', () => {
  test('trial → upgrade opens confirmation, then POSTs /billing/checkout with the right payload', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      summary: { paidSeats: 0, basePlanPrice: 19.99, pricePerTeamMember: 5 },
      billingDetails: { configured: true, entityType: 'company' },
    })
    const { requests } = await mockCheckoutEndpoint(
      page,
      '/api/billing/checkout',
      { url: STUB_CHECKOUT_URL },
    )
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 5 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    // Add 2 seats then click the hero Upgrade CTA
    await billing.incrementSeatsBy(2)
    await billing.upgradeHeroButton.click()

    await expect(billing.confirmDialog).toBeVisible({ timeout: 10_000 })
    await expect(billing.confirmDialog).toContainText(/Start new subscription/i)
    await billing.confirmDialogClick(/Continue/i)

    await expect.poll(() => requests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    const payload = JSON.parse(requests[0].postData() ?? '{}') as {
      seats?: number
      successUrl?: string
      cancelUrl?: string
    }
    expect(payload.seats).toBe(2)
    expect(payload.successUrl).toMatch(/\/info\?type=subscription-success$/)
    expect(payload.cancelUrl).toMatch(/\/account$/)
  })

  test('upgrade is blocked when invoice billing details are not configured (toast + auto-scroll)', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      summary: { paidSeats: 0 },
      billingDetails: { configured: false },
    })
    const { requests } = await mockCheckoutEndpoint(
      page,
      '/api/billing/checkout',
    )
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 5 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.upgradeHeroButton.click()
    await billing.expectToast(/Please fill in your invoice billing details/i)
    expect(requests.length).toBe(0)
    // Confirm dialog should never have appeared
    await expect(billing.confirmDialog).toHaveCount(0)
  })

  test('canceled state → Renew goes through the same checkout flow', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'canceled',
      summary: { paidSeats: 0, basePlanPrice: 19.99, pricePerTeamMember: 5 },
      billingDetails: { configured: true, entityType: 'company' },
      invoices: [
        {
          id: 1,
          invoiceType: 'subscription',
          status: 'success',
          amountMinor: 1999,
          currency: 'eur',
          oblioLink: null,
          oblioNumber: null,
          oblioSeriesName: null,
          createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
        },
      ],
    })
    const { requests } = await mockCheckoutEndpoint(
      page,
      '/api/billing/checkout',
      { url: STUB_CHECKOUT_URL },
    )
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'expired', paidTeamSeats: 0 },
        subscription: {
          status: 'canceled',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date(Date.now() - 7 * 86400_000).toISOString(),
          trialEndsAt: null,
        },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.renewButton.first().click()
    await expect(billing.confirmDialog).toBeVisible()
    await billing.confirmDialogClick(/Continue/i)

    await expect.poll(() => requests.length, { timeout: 10_000 }).toBeGreaterThan(0)
  })

  test('LTD with no seats → Upgrade hits /billing/ltd-seats-checkout (skips the standard confirm dialog)', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'ltd_no_seats',
      summary: { paidSeats: 0 },
      billingDetails: { configured: true, entityType: 'company' },
    })
    const { requests: ltdRequests } = await mockCheckoutEndpoint(
      page,
      '/api/billing/ltd-seats-checkout',
      { url: STUB_CHECKOUT_URL },
    )
    const { requests: regularRequests } = await mockCheckoutEndpoint(
      page,
      '/api/billing/checkout',
    )
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'ltd', paidTeamSeats: 0 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.incrementSeatsBy(1)
    await billing.updateSeatsButton.click()

    await expect.poll(() => ltdRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    expect(regularRequests.length).toBe(0)
  })
})
