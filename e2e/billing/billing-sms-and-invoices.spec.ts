import { expect, test } from '@playwright/test'
import { BillingPage } from '../pages/BillingPage'
import {
  mockBillingDefaults,
  mockCheckoutEndpoint,
  sampleInvoice,
  sampleSmsPackage,
} from '../fixtures/billing-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

test.describe('SMS card', () => {
  test('trial: SMS card shows the locked banner', async ({ page, request }) => {
    await mockBillingDefaults(page, { state: 'trial' })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.smsLockedBanner).toBeVisible()
    await expect(billing.smsBuyButton).toHaveCount(0)
  })

  test('inactive: SMS card shows the empty state', async ({ page, request }) => {
    await mockBillingDefaults(page, { state: 'inactive', summary: { paidSeats: 0 } })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'no_subscription', paidTeamSeats: 0 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.smsInactiveEmpty).toBeVisible()
  })

  test('active: shows balance, the package list and the Best value badge on the cheapest pack', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
      smsPackages: [
        sampleSmsPackage({ id: 1, name: 'Starter', smsCount: 100, priceMinor: 5000 }),
        sampleSmsPackage({ id: 2, name: 'Growth', smsCount: 500, priceMinor: 20000 }),
        sampleSmsPackage({ id: 3, name: 'Pro', smsCount: 1000, priceMinor: 35000 }),
      ],
      smsCredits: 245,
      smsTotalPurchased: 500,
      smsTotalUsed: 255,
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.smsBalanceValue).toContainText('245')
    await expect(billing.smsPackages).toHaveCount(3)
    await expect(page.locator('.bv2-pack-badge', { hasText: /Best value/i }).first()).toBeVisible()
  })

  test('active: selecting a pack and clicking buy triggers POST /sms/checkout with the right packageId', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
      billingDetails: { configured: true, entityType: 'company' },
      smsPackages: [
        sampleSmsPackage({ id: 1, smsCount: 100, priceMinor: 5000 }),
        sampleSmsPackage({ id: 2, smsCount: 500, priceMinor: 20000 }),
      ],
    })
    const { requests } = await mockCheckoutEndpoint(page, '/api/sms/checkout')
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    // Click the second pack and buy
    await billing.smsPackages.nth(1).click()
    await billing.smsBuyButton.click()

    await expect.poll(() => requests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    const payload = JSON.parse(requests[0].postData() ?? '{}') as { packageId: number }
    expect(payload.packageId).toBe(2)
  })

  test('active without billing details → buy SMS shows the configure-first toast', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
      billingDetails: { configured: false },
      smsPackages: [sampleSmsPackage({ id: 1, smsCount: 100, priceMinor: 5000 })],
    })
    const { requests } = await mockCheckoutEndpoint(page, '/api/sms/checkout')
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.smsBuyButton.click()
    await billing.expectToast(/Please fill in your invoice billing details/i)
    expect(requests.length).toBe(0)
  })

  test('active with no available packages shows the no-packs empty state', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
      smsPackages: [],
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(page.getByText(/No packages available/i)).toBeVisible()
  })
})

test.describe('Invoice history', () => {
  test('empty list shows the empty state', async ({ page, request }) => {
    await mockBillingDefaults(page, { state: 'active', invoices: [] })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.historyEmpty).toBeVisible()
  })

  test('renders one row per invoice and a download link for invoices with an oblioLink', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
      invoices: [
        sampleInvoice({
          id: 1,
          invoiceType: 'subscription',
          amountMinor: 1999,
          oblioLink: 'https://oblio.test/invoice/1',
        }),
        sampleInvoice({
          id: 2,
          invoiceType: 'sms_purchase',
          amountMinor: 5000,
          oblioLink: 'https://oblio.test/invoice/2',
          createdAt: new Date(Date.now() - 86400_000).toISOString(),
        }),
        sampleInvoice({
          id: 3,
          invoiceType: 'ltd_seats',
          status: 'failed',
          amountMinor: 19900,
          oblioLink: null,
          createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
        }),
      ],
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.historyRows).toHaveCount(3)
    // Two invoices have oblioLink → two download icons
    await expect(billing.historyDownloadLinks).toHaveCount(2)
    // Failed invoice surfaces the "Invoice pending" pill
    await expect(page.getByText(/Invoice pending/i)).toBeVisible()
  })

  test('download link opens in a new tab', async ({ page, request }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
      invoices: [
        sampleInvoice({
          id: 1,
          oblioLink: 'https://oblio.test/invoice/abc',
        }),
      ],
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    const link = billing.historyDownloadLinks.first()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('href', /https:\/\/oblio\.test\/invoice\/abc/)
  })
})
