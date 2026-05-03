import { expect, test } from '@playwright/test'
import { BillingPage } from '../pages/BillingPage'
import {
  mockBillingDefaults,
  mockStripeJs,
  mockSubscriptionMutation,
  mockUpdateSeats,
} from '../fixtures/billing-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Seat management exercises POST /billing/update-seats. Possible response
// shapes from the real backend:
//   { success: true }                     → redirect to seats-update-success
//   { url: 'https://stripe…' }            → redirect to checkout
//   { requiresAction, clientSecret }      → inline 3DS via Stripe.js stub
//   error                                 → toast + state refresh
//
// We replace window.location.href reassignment with a navigation interception
// so the test doesn't actually leave the dev origin during the redirect.

test.describe('Seat management', () => {
  test('active state, +1 seat, success → /billing/update-seats called with the new total', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2, basePlanPrice: 19.99, pricePerTeamMember: 5 },
      billingDetails: { configured: true, entityType: 'company' },
    })
    const { requests } = await mockUpdateSeats(page, { kind: 'success' })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.incrementSeatsBy(1)
    await billing.updateSeatsButton.click()

    await expect(billing.confirmDialog).toBeVisible({ timeout: 10_000 })
    await expect(billing.confirmDialog).toContainText(/Confirm seat increase/i)
    await billing.confirmDialogClick(/Add seats/i)

    await expect.poll(() => requests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    const payload = JSON.parse(requests[0].postData() ?? '{}') as { seats: number }
    expect(payload.seats).toBe(4)
  })

  test('active state, +1 seat, requiresAction → Stripe.js stub confirms payment, then redirects', async ({
    page,
    request,
  }) => {
    await mockStripeJs(page, { confirmCardPaymentResult: { kind: 'success' } })
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
      billingDetails: { configured: true, entityType: 'company' },
    })
    await mockUpdateSeats(page, {
      kind: 'requires_action',
      clientSecret: 'pi_test_secret_e2e',
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.incrementSeatsBy(1)
    await billing.updateSeatsButton.click()
    await billing.confirmDialogClick(/Add seats/i)

    // After confirmCardPayment resolves successfully the dashboard navigates
    // to /info?type=seats-update-success — assert the redirect to confirm the
    // 3DS branch ran end-to-end. (The page-side __e2eStripeCalls counter is
    // wiped by the navigation, so assert the URL instead.)
    await expect(page).toHaveURL(/\/info\?type=seats-update-success/, {
      timeout: 15_000,
    })
  })

  test('active state, +1 seat, requiresAction → Stripe.js error triggers abort + error toast', async ({
    page,
    request,
  }) => {
    await mockStripeJs(page, {
      confirmCardPaymentResult: { kind: 'error', message: 'Card declined' },
    })
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 2 },
      billingDetails: { configured: true, entityType: 'company' },
    })
    await mockUpdateSeats(page, {
      kind: 'requires_action',
      clientSecret: 'pi_test_secret_decline',
    })
    const { abortRequests } = await mockSubscriptionMutation(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.incrementSeatsBy(1)
    await billing.updateSeatsButton.click()
    await billing.confirmDialogClick(/Add seats/i)

    await billing.expectToast(/Card declined/i)
    await expect.poll(() => abortRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)
  })

  test('active state, decrement seat → confirm dialog says "next billing period"', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 1 },
      billingDetails: { configured: true, entityType: 'company' },
    })
    await mockUpdateSeats(page, { kind: 'success' })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 1 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.decrementSeatsBy(1)
    await billing.updateSeatsButton.click()

    await expect(billing.confirmDialog).toBeVisible()
    await expect(billing.confirmDialog).toContainText(/Confirm seat reduction/i)
    await expect(billing.confirmDialog).toContainText(/end of the billing period/i)
  })

  test('active state, cannot reduce below currently-used seats → toast warning + clamp', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'active',
      summary: { paidSeats: 3, usedSeats: 3 },
      billingDetails: { configured: true, entityType: 'company' },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 3 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    // Try to drop below used count
    await billing.decrementSeatsBy(1)
    await billing.expectToast(/seats? in use/i)
    // Stepper clamps back to the used count (3)
    await expect(billing.seatStepperValue).toHaveText('3')
  })

  test('pending_inc state → Revert change → /billing/cancel-removal called', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'pending_inc',
      summary: { paidSeats: 3, usedSeats: 2, scheduledSeats: 5 },
      billingDetails: { configured: true, entityType: 'company' },
    })
    const { cancelRemovalRequests } = await mockSubscriptionMutation(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: {
        entitlements: { status: 'active', paidTeamSeats: 3, usedSeats: 2 },
        subscription: { status: 'active', cancelAtPeriodEnd: false, trialEndsAt: null },
      },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.revertChangeButton.first().click()
    await billing.confirmDialogClick(/Undo Cancellation|Undo|Yes/i)

    await expect
      .poll(() => cancelRemovalRequests.length, { timeout: 10_000 })
      .toBeGreaterThan(0)
  })
})
