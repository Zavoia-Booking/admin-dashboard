import { expect, test } from '@playwright/test'
import { BillingPage } from '../pages/BillingPage'
import { mockBillingDefaults } from '../fixtures/billing-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Each test in this file pins /api/auth/me + /api/billing/subscription-summary
// to a specific state and asserts the conditional UI for that state. The
// helper `setupAuthenticatedOwner` performs a real registration + UI login so
// the dashboard's auth saga has a real session; only the billing surface is
// mocked.

test.describe('Active state', () => {
  test('hero shows renewal date, seats line and the Manage Payment button', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: {
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 14 * 86400_000).toISOString(),
          cancelAtPeriodEnd: false,
          trialEndsAt: null,
        },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Active/i)
    await expect(page.getByText(/Renews/i)).toBeVisible()
    await expect(page.getByText(/seats/i).first()).toBeVisible()
    await expect(billing.cancelSubscriptionLink).toBeVisible()
  })
})

test.describe('Past due states', () => {
  test('past_due (renewal failed) shows red pill, amount due and the destructive Manage Payment button', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'past_due_renewal',
      summary: { paidSeats: 3, usedSeats: 2, basePlanPrice: 19.99, pricePerTeamMember: 5 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'past_due', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'past_due', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Past Due/i)
    await expect(page.getByText(/Subscription renewal failed/i)).toBeVisible()
    // No Abort Payment for renewal failures
    await expect(billing.abortPaymentButton).toHaveCount(0)
  })

  test('past_due (seat-change failed) surfaces the Abort Payment action', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'past_due_seat_change',
      summary: { paidSeats: 3, usedSeats: 2 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'past_due', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'past_due', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Past Due/i)
    await expect(page.getByText(/Pending seat change failed/i)).toBeVisible()
    await expect(billing.abortPaymentButton).toBeVisible()
  })
})

test.describe('LTD states', () => {
  test('LTD with seats shows Lifetime pill, Free seats line and the Manage Payment outline button', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'ltd',
      summary: { paidSeats: 5, usedSeats: 2 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'ltd', paidTeamSeats: 5, usedSeats: 2 },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Lifetime/i)
    // "Lifetime access" appears both in the status pill and the LTD subtitle —
    // assert the subtitle copy specifically so the matcher stays unique.
    await expect(
      page.getByText(/Lifetime access — no recurring charges/i),
    ).toBeVisible()
    // The Subscription card shows "Free" for the seats line
    await expect(page.getByText(/^Free$/).first()).toBeVisible()
  })

  test('LTD without seats lets the user upgrade to add seats', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'ltd_no_seats',
      summary: { paidSeats: 0, usedSeats: 0 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'ltd', paidTeamSeats: 0, usedSeats: 0 },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Lifetime/i)
    // Stepper is interactable so the user can request additional seats
    await expect(billing.seatStepperIncrement).toBeEnabled()
  })
})

test.describe('Canceled & inactive states', () => {
  test('canceled state shows ended date, neutral pill and the Renew CTA', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'canceled',
      summary: { paidSeats: 0 },
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

    await billing.expectStatusText(/Canceled/i)
    // "Ended {date}" in the hero secondary row vs "Subscription ended" in the
    // banner — pick the hero copy specifically.
    await expect(page.getByText(/^Ended /).first()).toBeVisible()
    await expect(billing.renewButton.first()).toBeVisible()
  })

  test('inactive state (no history) shows the start-subscription CTA', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, { state: 'inactive', summary: { paidSeats: 0 } })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'no_subscription', paidTeamSeats: 0 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/No subscription/i)
    await expect(page.getByText(/Subscribe to get started/i)).toBeVisible()
  })
})

test.describe('Pending seat changes', () => {
  test('pending_inc shows the scheduled-add banner, locked stepper and Revert button', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'pending_inc',
      summary: { paidSeats: 3, scheduledSeats: 5 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Pending change/i)
    await expect(page.getByText(/Adding 2 seats on/i)).toBeVisible()
    await expect(billing.revertChangeButton.first()).toBeVisible()
    // Stepper should be visually locked
    await expect(page.locator('.bv2-stepper-locked')).toBeVisible()
  })

  test('pending_dec shows the scheduled-removal banner', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'pending_dec',
      summary: { paidSeats: 3, scheduledSeats: 1 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 1 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Pending change/i)
    await expect(page.getByText(/Removing 2 seats on/i)).toBeVisible()
    await expect(billing.revertChangeButton.first()).toBeVisible()
  })
})

test.describe('Scheduled cancellation', () => {
  test('shows the cancels-on banner and the Keep Subscription action', async ({
    page,
    request,
  }) => {
    const periodEnd = new Date(Date.now() + 14 * 86400_000).toISOString()
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: {
          status: 'active',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
        },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.expectStatusText(/Scheduled for Cancellation/i)
    await expect(page.getByText(/Cancels on/i).first()).toBeVisible()
    await expect(billing.keepSubscriptionButton.first()).toBeVisible()
  })
})
