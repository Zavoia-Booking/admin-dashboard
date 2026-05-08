import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { ReconciliationModal } from '../pages/ReconciliationModal'
import {
  mockAuthMeForOwner,
  seedSeatOverflowFixture,
} from '../fixtures/reconciliation-seed'
import { getAppointmentStatus, markWizardComplete } from '../fixtures/test-db'

test.describe('Reconciliation — seat overflow auto-trigger', () => {
  test('auto-opens after login when usedSeats > paidSeats and stays closed on /account', async ({ page }) => {
    const seed = await seedSeatOverflowFixture()
    await markWizardComplete(seed.owner.userId)

    // Owner has 3 active team members + the owner = 4. Pretend the plan only
    // pays for 2 — overflow by 2.
    await mockAuthMeForOwner(page, seed.owner, {
      status: 'active',
      paidTeamSeats: 2,
      usedSeats: 4,
    })

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('seat_overflow')

    // Modal must NOT show on the deferred billing route.
    await page.goto('/account?tab=billing')
    await modal.expectClosed()

    // …and must reopen when leaving that route.
    await page.goto('/team-members')
    await modal.expectVisible('seat_overflow')
  })

  test('removing one member resolves the overflow and commits the appointment decision', async ({ page }) => {
    const seed = await seedSeatOverflowFixture()
    await markWizardComplete(seed.owner.userId)

    await mockAuthMeForOwner(page, seed.owner, {
      status: 'active',
      paidTeamSeats: 2,
      usedSeats: 4,
    })

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('seat_overflow')

    await modal.selectMember(seed.primaryMember.user.firstName)
    const customerName = `${seed.customer.firstName} ${seed.customer.lastName}`
    await modal.expectAppointmentRow(customerName)
    await modal.reassignAppointment(customerName, seed.cover.user.firstName)
    await modal.expectPrimaryEnabled()
    await modal.clickPrimary()

    // The seat_overflow modal does not auto-close after a partial commit —
    // the SeatOverflowDetector decides based on entitlements (which we mock).
    // What we can deterministically verify:
    //   1) the backend reassigned the appointment, and
    //   2) the offboarded member's row disappears from the aside.
    await expect.poll(
      async () => (await getAppointmentStatus(seed.appointment.id)).staffUserIds,
      { timeout: 15_000 },
    ).toEqual([seed.cover.userId])
    await expect(
      page.getByRole('button', { name: new RegExp(`^${seed.primaryMember.user.firstName}\\b`, 'i') }),
    ).toHaveCount(0, { timeout: 15_000 })
  })

  test('"Pay for extra seats" CTA navigates to billing and closes the modal there', async ({ page }) => {
    const seed = await seedSeatOverflowFixture()
    await markWizardComplete(seed.owner.userId)

    await mockAuthMeForOwner(page, seed.owner, {
      status: 'active',
      paidTeamSeats: 2,
      usedSeats: 4,
    })

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('seat_overflow')
    await modal.payForSeatsButton().click()
    await page.waitForURL(/\/account\?tab=billing/)
    await modal.expectClosed()
  })
})
