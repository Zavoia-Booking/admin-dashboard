import { expect, test } from '@playwright/test'
import { BillingPage } from '../pages/BillingPage'
import {
  mockBillingDefaults,
  mockSubscriptionMutation,
} from '../fixtures/billing-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

test.describe('Cancel & keep subscription flows', () => {
  test('active → Cancel Subscription → POST /billing/modify-subscription?action=cancel', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
    })
    const { modifyRequests } = await mockSubscriptionMutation(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: {
          status: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date(Date.now() + 14 * 86400_000).toISOString(),
          trialEndsAt: null,
        },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.cancelSubscriptionLink.click()
    await expect(billing.confirmDialog).toBeVisible({ timeout: 10_000 })
    await expect(billing.confirmDialog).toContainText(/Cancel Subscription/i)
    await billing.confirmDialogClick(/Cancel Subscription/i)

    await expect.poll(() => modifyRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    expect(modifyRequests[0].url()).toMatch(/action=cancel/)
  })

  test('past_due renewal → Cancel Subscription dialog warns about immediate cancellation', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'past_due_renewal',
      summary: { paidSeats: 3, usedSeats: 2 },
    })
    await mockSubscriptionMutation(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'past_due', paidTeamSeats: 3, usedSeats: 2 },
        subscription: {
          status: 'past_due',
          cancelAtPeriodEnd: false,
          trialEndsAt: null,
        },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.cancelSubscriptionLink.click()
    await expect(billing.confirmDialog).toBeVisible({ timeout: 10_000 })
    await expect(billing.confirmDialog).toContainText(/cancellation is immediate/i)
  })

  test('scheduled cancellation → Keep Subscription → POST /billing/modify-subscription?action=keep', async ({
    page,
    request,
  }) => {
    const periodEnd = new Date(Date.now() + 14 * 86400_000).toISOString()
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
    })
    const { modifyRequests } = await mockSubscriptionMutation(page)
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
    await billing.keepSubscriptionButton.first().click()
    await expect(billing.confirmDialog).toBeVisible({ timeout: 10_000 })
    await billing.confirmDialogClick(/Keep Subscription/i)

    await expect.poll(() => modifyRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    expect(modifyRequests[0].url()).toMatch(/action=keep/)
  })

  test('past_due seat-change → Abort Payment → POST /billing/abort-pending-payment + success toast', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'past_due_seat_change',
      summary: { paidSeats: 3, usedSeats: 2 },
    })
    const { abortRequests } = await mockSubscriptionMutation(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'past_due', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'past_due', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.abortPaymentButton).toBeVisible()
    await billing.abortPaymentButton.click()

    await expect.poll(() => abortRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    await billing.expectToast(/Payment cancelled/i)
  })
})
